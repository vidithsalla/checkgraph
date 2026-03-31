"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import * as schema from "@/lib/db/schema";
import { getNextSequenceNo, recomputeCheck } from "@/lib/server/checks/recompute-check";
import { assertPrototypeActor, loadWriteSnapshot } from "@/lib/server/checks/write-guards";

const overrideSchema = z.object({
  checkId: z.string().uuid(),
  externalCheckRef: z.string().min(1),
  reason: z.string().trim().min(10).max(400),
});

export async function applyPaymentOverride(formData: FormData) {
  const parsed = overrideSchema.parse({
    checkId: formData.get("checkId"),
    externalCheckRef: formData.get("externalCheckRef"),
    reason: formData.get("reason"),
  });
  const { actorRole, actorId } = assertPrototypeActor(["manager", "admin"]);

  await db.transaction(async (tx) => {
    const snapshot = await loadWriteSnapshot(tx, parsed.checkId);

    if (snapshot.check.externalCheckRef !== parsed.externalCheckRef) {
      throw new Error("External check reference does not match the current check.");
    }

    if (
      snapshot.derivedState?.paymentState === "closed" ||
      snapshot.derivedState?.serviceState === "completed"
    ) {
      throw new Error("Payment confirmation override is not allowed on a completed check.");
    }

    if (
      !snapshot.eventTypes.has("network_degraded") &&
      !snapshot.eventTypes.has("terminal_offline") &&
      !snapshot.eventTypes.has("fallback_mode_entered") &&
      !snapshot.activeExceptionTypes.has("network_degraded_during_payment") &&
      !snapshot.activeExceptionTypes.has("terminal_offline_during_close") &&
      !snapshot.activeExceptionTypes.has("fallback_mode_unresolved")
    ) {
      throw new Error(
        "Payment confirmation override is only allowed for active fallback or terminal-degradation cases.",
      );
    }

    if (
      snapshot.eventTypes.has("manual_override_applied") &&
      !snapshot.activeExceptionTypes.has("network_degraded_during_payment") &&
      !snapshot.activeExceptionTypes.has("terminal_offline_during_close") &&
      !snapshot.activeExceptionTypes.has("fallback_mode_unresolved")
    ) {
      throw new Error("Payment confirmation override was already applied for this check.");
    }

    const sequenceNo = await getNextSequenceNo(tx, parsed.checkId);
    const occurredAt = new Date();

    await tx.insert(schema.checkEvents).values({
      checkId: parsed.checkId,
      sequenceNo,
      eventType: "manual_override_applied",
      eventGroup: "overrides",
      occurredAt,
      sourceSystem: "ops_console",
      actorType: actorRole,
      actorId,
      payloadJson: {
        overrideType: "mark_payment_confirmed",
        reason: parsed.reason,
        actorRole,
      },
    });

    await tx.insert(schema.auditLogs).values({
      entityType: "check",
      entityId: parsed.checkId,
      actionType: "mark_payment_confirmed",
      actorRole,
      actorId,
      note: parsed.reason,
      payloadJson: {
        overrideType: "mark_payment_confirmed",
      },
    });

    await recomputeCheck(tx, parsed.checkId);
  });

  revalidatePath("/overview");
  revalidatePath("/exceptions");
  revalidatePath(`/checks/${parsed.externalCheckRef}`);
}
