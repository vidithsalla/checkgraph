"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db/client";
import * as schema from "@/lib/db/schema";
import { getNextSequenceNo, recomputeCheck } from "@/lib/server/checks/recompute-check";
import { assertPrototypeActor, loadWriteSnapshot } from "@/lib/server/checks/write-guards";

const markDepositForRefundSchema = z.object({
  checkId: z.string().uuid(),
  externalCheckRef: z.string().min(1),
  bookingRef: z.string().min(1),
  depositRef: z.string().min(1),
  amountCents: z.coerce.number().int().positive(),
  reason: z.string().trim().min(10).max(400),
});

export async function markDepositForRefund(formData: FormData) {
  const parsed = markDepositForRefundSchema.parse({
    checkId: formData.get("checkId"),
    externalCheckRef: formData.get("externalCheckRef"),
    bookingRef: formData.get("bookingRef"),
    depositRef: formData.get("depositRef"),
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
      throw new Error("Deposit refund requires a matching booking context.");
    }

    if (snapshot.booking.status !== "cancelled") {
      throw new Error("Deposit refund can only be initiated after the booking is cancelled.");
    }

    const deposit = snapshot.deposits.find((row) => row.depositRef === parsed.depositRef);
    if (!deposit) {
      throw new Error("Deposit not found for the current booking.");
    }

    if (!["captured", "hold_active"].includes(deposit.state)) {
      throw new Error("Deposit refund can only be initiated for an active deposit hold or captured deposit.");
    }

    if (deposit.refundableAmountCents <= 0) {
      throw new Error("No refundable deposit amount remains for this booking.");
    }

    if (parsed.amountCents !== deposit.refundableAmountCents) {
      throw new Error("Submitted refund amount does not match the current refundable deposit amount.");
    }

    const sequenceNo = await getNextSequenceNo(tx, parsed.checkId);
    const occurredAt = new Date();

    await tx.insert(schema.checkEvents).values({
      checkId: parsed.checkId,
      sequenceNo,
      eventType: "deposit_refund_initiated",
      eventGroup: "deposit",
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
      actionType: "mark_deposit_for_refund",
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

  revalidatePath("/overview");
  revalidatePath("/exceptions");
  revalidatePath(`/checks/${parsed.externalCheckRef}`);
}
