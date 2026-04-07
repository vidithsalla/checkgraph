"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  ActionValidationError,
  idleActionResult,
  type ActionResult,
} from "@/features/checks/actions/action-result";
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

export type ApplyHostedCoverageInput = z.infer<typeof applyHostedCoverageSchema>;

export async function applyHostedCoverageToCheckMutation(parsed: ApplyHostedCoverageInput) {
  const { actorRole, actorId } = assertPrototypeActor(["manager", "admin"]);

  await db.transaction(async (tx) => {
    const snapshot = await loadWriteSnapshot(tx, parsed.checkId);

    if (snapshot.check.externalCheckRef !== parsed.externalCheckRef) {
      throw new ActionValidationError("External check reference does not match the current check.");
    }

    if (!snapshot.booking || snapshot.booking.bookingRef !== parsed.bookingRef) {
      throw new ActionValidationError("Hosted coverage requires a matching booking context.");
    }

    if (snapshot.booking.status === "cancelled") {
      throw new ActionValidationError("Hosted coverage cannot be applied to a cancelled booking.");
    }

    if (snapshot.booking.hostedAmountCents <= 0) {
      throw new ActionValidationError("No hosted coverage is configured for this booking.");
    }

    const hostedApplied = snapshot.derivedState?.hostedAppliedAmountCents ?? 0;
    const directPaymentDue =
      snapshot.derivedState?.directPaymentDueCents ?? snapshot.check.totalAmountCents;
    const remainingHosted = Math.max(0, snapshot.booking.hostedAmountCents - hostedApplied);

    if (remainingHosted <= 0) {
      throw new ActionValidationError("No unapplied hosted coverage remains for this booking.");
    }

    if (parsed.amountCents !== remainingHosted) {
      throw new ActionValidationError(
        "Submitted hosted amount does not match the current unapplied hosted coverage.",
      );
    }

    if (directPaymentDue <= 0) {
      throw new ActionValidationError(
        "Hosted coverage is not allowed when the check has no remaining balance to fund.",
      );
    }

    if (parsed.amountCents > directPaymentDue) {
      throw new ActionValidationError(
        "Submitted hosted amount exceeds the current unpaid balance on the check.",
      );
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
}

export async function applyHostedCoverageToCheck(
  _previousState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const parsed = applyHostedCoverageSchema.parse({
      checkId: formData.get("checkId"),
      externalCheckRef: formData.get("externalCheckRef"),
      bookingRef: formData.get("bookingRef"),
      amountCents: formData.get("amountCents"),
      reason: formData.get("reason"),
    });
    await applyHostedCoverageToCheckMutation(parsed);

    revalidatePath("/overview");
    revalidatePath("/exceptions");
    revalidatePath(`/checks/${parsed.externalCheckRef}`);
    return idleActionResult;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        status: "error",
        message: "Please provide the required hosted coverage details before submitting.",
      };
    }

    if (error instanceof ActionValidationError) {
      return {
        status: "error",
        message: error.message,
      };
    }

    console.error("applyHostedCoverageToCheck failed", error);
    return {
      status: "error",
      message: "Unable to complete this action right now. Refresh the page and try again.",
    };
  }
}
