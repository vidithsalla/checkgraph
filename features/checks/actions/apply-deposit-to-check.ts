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

const applyDepositSchema = z.object({
  checkId: z.string().uuid(),
  externalCheckRef: z.string().min(1),
  bookingRef: z.string().min(1),
  depositRef: z.string().min(1),
  amountCents: z.coerce.number().int().positive(),
  reason: z.string().trim().min(10).max(400),
});

export type ApplyDepositInput = z.infer<typeof applyDepositSchema>;

export async function applyDepositToCheckMutation(parsed: ApplyDepositInput) {
  const { actorRole, actorId } = assertPrototypeActor(["manager", "admin"]);

  await db.transaction(async (tx) => {
    const snapshot = await loadWriteSnapshot(tx, parsed.checkId);

    if (snapshot.check.externalCheckRef !== parsed.externalCheckRef) {
      throw new ActionValidationError("External check reference does not match the current check.");
    }

    if (!snapshot.booking || snapshot.booking.bookingRef !== parsed.bookingRef) {
      throw new ActionValidationError("Deposit application requires a matching booking context.");
    }

    if (snapshot.booking.status === "cancelled") {
      throw new ActionValidationError("Captured deposit cannot be applied after the booking has been cancelled.");
    }

    const deposit = snapshot.deposits.find((row) => row.depositRef === parsed.depositRef);
    if (!deposit) {
      throw new ActionValidationError("Deposit not found for the current booking.");
    }

    const directPaymentDue =
      snapshot.derivedState?.directPaymentDueCents ?? snapshot.check.totalAmountCents;
    const remainingDeposit = Math.max(0, deposit.amountCents - deposit.appliedAmountCents);
    if (remainingDeposit <= 0) {
      throw new ActionValidationError("No unapplied captured deposit remains for this booking.");
    }

    if (!["captured", "partially_applied"].includes(deposit.state)) {
      throw new ActionValidationError(
        "Deposit application is only allowed for captured deposits with unapplied value.",
      );
    }

    if (parsed.amountCents !== remainingDeposit) {
      throw new ActionValidationError(
        "Submitted deposit amount does not match the current unapplied deposit value.",
      );
    }

    if (directPaymentDue <= 0) {
      throw new ActionValidationError(
        "Deposit application is not allowed when the check has no remaining balance to fund.",
      );
    }

    if (parsed.amountCents > directPaymentDue) {
      throw new ActionValidationError(
        "Submitted deposit amount exceeds the current unpaid balance on the check.",
      );
    }

    const sequenceNo = await getNextSequenceNo(tx, parsed.checkId);
    const occurredAt = new Date();

    await tx.insert(schema.checkEvents).values({
      checkId: parsed.checkId,
      sequenceNo,
      eventType: "deposit_applied_to_check",
      eventGroup: "allocation",
      occurredAt,
      sourceSystem: "ops_console",
      actorType: actorRole,
      actorId,
      payloadJson: {
        bookingRef: parsed.bookingRef,
        depositRef: parsed.depositRef,
        amountCents: parsed.amountCents,
        reason: parsed.reason,
        actorRole,
      },
    });

    await tx.insert(schema.auditLogs).values({
      entityType: "check",
      entityId: parsed.checkId,
      actionType: "apply_deposit_to_check",
      actorRole,
      actorId,
      note: parsed.reason,
      payloadJson: {
        bookingRef: parsed.bookingRef,
        depositRef: parsed.depositRef,
        amountCents: parsed.amountCents,
      },
    });

    await recomputeCheck(tx, parsed.checkId);
  });
}

export async function applyDepositToCheck(
  _previousState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const parsed = applyDepositSchema.parse({
      checkId: formData.get("checkId"),
      externalCheckRef: formData.get("externalCheckRef"),
      bookingRef: formData.get("bookingRef"),
      depositRef: formData.get("depositRef"),
      amountCents: formData.get("amountCents"),
      reason: formData.get("reason"),
    });
    await applyDepositToCheckMutation(parsed);

    revalidatePath("/overview");
    revalidatePath("/exceptions");
    revalidatePath(`/checks/${parsed.externalCheckRef}`);
    return idleActionResult;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        status: "error",
        message: "Please provide the required deposit action details before submitting.",
      };
    }

    if (error instanceof ActionValidationError) {
      return {
        status: "error",
        message: error.message,
      };
    }

    console.error("applyDepositToCheck failed", error);
    return {
      status: "error",
      message: "Unable to complete this action right now. Refresh the page and try again.",
    };
  }
}
