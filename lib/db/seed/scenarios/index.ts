import { cancelledBookingActiveDepositScenario } from "./cancelled-booking-active-deposit";
import { delayedReceiptScenario } from "./delayed-receipt";
import { duplicateChargeScenario } from "./duplicate-charge";
import { happyPathScenario } from "./happy-path";
import { hostedDepositUnappliedScenario } from "./hosted-deposit-unapplied";
import { hostedEventScenario } from "./hosted-event";
import { hostedPartialCoverageScenario } from "./hosted-partial-coverage";
import { networkFallbackScenario } from "./network-fallback";
import { payerMismatchScenario } from "./payer-mismatch";
import { preauthConfusionScenario } from "./preauth-confusion";
import { vipLinkingScenario } from "./vip-linking";

export const canonicalScenarios = [
  happyPathScenario,
  preauthConfusionScenario,
  delayedReceiptScenario,
  duplicateChargeScenario,
  payerMismatchScenario,
  networkFallbackScenario,
  vipLinkingScenario,
  hostedEventScenario,
  hostedDepositUnappliedScenario,
  hostedPartialCoverageScenario,
  cancelledBookingActiveDepositScenario,
];

export * from "./types";
