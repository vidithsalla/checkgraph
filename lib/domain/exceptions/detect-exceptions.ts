import type { DomainCheckContext, DerivedCheckState, DetectedException } from "@/lib/domain/types";
import { detectHostedDepositExceptions } from "./hosted-deposit-rules";
import { detectIdentityExceptions } from "./identity-rules";
import { detectOperationalExceptions } from "./ops-rules";
import { detectPaymentExceptions } from "./payment-rules";
import { detectReceiptExceptions } from "./receipt-rules";
import { detectRewardsExceptions } from "./rewards-rules";

export function detectExceptions(
  context: DomainCheckContext,
  derivedState: DerivedCheckState,
): DetectedException[] {
  return [
    ...detectPaymentExceptions(context, derivedState),
    ...detectReceiptExceptions(context),
    ...detectRewardsExceptions(context, derivedState),
    ...detectIdentityExceptions(context),
    ...detectHostedDepositExceptions(context, derivedState),
    ...detectOperationalExceptions(context),
  ];
}
