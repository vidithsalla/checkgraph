"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db/client";
import * as schema from "@/lib/db/schema";
import { getNextSequenceNo, recomputeCheck } from "@/lib/server/checks/recompute-check";
import { assertPrototypeActor, loadWriteSnapshot } from "@/lib/server/checks/write-guards";

const applyHostedCoverageSchema = z.object({
  checkId: z.string().uuid(),
  externalCheckRef: z.string().min(1),
  bookingRef: z.string().min(1),
  amountCents: z.coerce.number().int().positive(),
  reason: z.string().trim().min(10).max(400),
});

export async function applyHostedCoverageToCheck(formData: FormData) {
  const parsed = applyHostedCoverageSchema.parse({
    checkId: formData.get("checkId"),
    externalCheckRef: formData.get("externalCheckRef"),
    bookingRef: formData.get("bookingRef"),
    amountCents: formData.get("amountCents"),
    reason: formData.get("reason"),
  });
  const { actorRole, actorId } = assertPrototypeActor(["manager", "admin"]);

  await db.transaction(async (tx) => {
    const snapshot = await loadWriteSnapshot(tx, parsed.checkId);

    if (snapshot.check.externalCheckRef !== parsed.externalCheckRef) {
      throw new Error("External check reference does not match the current check.");
    }

    if (!snapshot.booking || snapshot.booking.bookingRef !== parsed.bookingRef) {
      throw new Error("Hosted coverage requires a matching booking context.");
    }

    if (snapshot.booking.status === "cancelled") {
      throw new Error("Hosted coverage cannot be applied to a cancelled booking.");
    }

    if (snapshot.booking.hostedAmountCents <= 0) {
      throw new Error("No hosted coverage is configured for this booking.");
    }

    const hostedApplied = snapshot.derivedState?.hostedAppliedAmountCents ?? 0;
    const directPaymentDue = snapshot.derivedState?.directPaymentDueCents ?? snapshot.check.totalAmountCents;
    const remainingHosted = Math.max(0, snapshot.booking.hostedAmountCents - hostedApplied);

    if (remainingHosted <= 0) {
      throw new Error("No unapplied hosted coverage remains for this booking.");
    }

    if (parsed.amountCents !== remainingHosted) {
      throw new Error("Submitted hosted amount does not match the current unapplied hosted coverage.");
    }

    if (directPaymentDue <= 0) {
      throw new Error("Hosted coverage is not allowed when the check has no remaining balance to fund.");
    }

    if (parsed.amountCents > directPaymentDue) {
      throw new Error("Submitted hosted amount exceeds the current unpaid balance on the check.");
    }

    const sequenceNo = await getNextSequenceNo(tx, parsed.checkId);
    const occurredAt = new Date();

    await tx.insert(schema.checkEvents).values({
      checkId: parsed.checkId,
      sequenceNo,
      eventType: "hosted_credit_applied_to_check",
      eventGroup: "allocation",
      occurredAt,
      sourceSystem: "ops_console",
      actorType: actorRole,
      actorId,
      payloadJson: {
        bookingRef: parsed.bookingRef,
        amountCents: parsed.amountCents,
        sourceLabel: "hosted event coverage",
        reason: parsed.reason,
        actorRole,
      },
    });

    await tx.insert(schema.auditLogs).values({
      entityType: "check",
      entityId: parsed.checkId,
      actionType: "apply_hosted_coverage_to_check",
      actorRole,
      actorId,
      note: parsed.reason,
      payloadJson: {
        bookingRef: parsed.bookingRef,
        amountCents: parsed.amountCents,
      },
    });

    await recomputeCheck(tx, parsed.checkId);
  });

  revalidatePath("/overview");
  revalidatePath("/exceptions");
  revalidatePath(`/checks/${parsed.externalCheckRef}`);
}
