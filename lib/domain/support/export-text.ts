import type { SupportSummary } from "./generate-support-summary";

export function exportSupportSummaryText(summary: SupportSummary) {
  const lines = [
    "Support Summary",
    `Check: ${summary.checkId}`,
    `Restaurant: ${summary.restaurant}`,
    `Table: ${summary.tableLabel}`,
    `Total: ${summary.total}`,
    "",
    "Booking",
    ...(summary.bookingSummary.length > 0
      ? summary.bookingSummary.map((item) => `- ${item}`)
      : ["- None"]),
    "",
    "Deposit",
    ...(summary.depositSummary.length > 0
      ? summary.depositSummary.map((item) => `- ${item}`)
      : ["- None"]),
    "",
    "Funding",
    ...summary.fundingSummary.map((item) => `- ${item}`),
    "",
    "Payment",
    ...summary.paymentSummary.map((item) => `- ${item}`),
    "",
    "Receipt",
    ...summary.receiptSummary.map((item) => `- ${item}`),
    "",
    "Rewards",
    ...summary.rewardsSummary.map((item) => `- ${item}`),
    "",
    "Identity",
    ...summary.identitySummary.map((item) => `- ${item}`),
    "",
    "Guest Roles",
    ...summary.guestRoleSummary.map((item) => `- ${item}`),
    "",
    "Active Exceptions",
    ...(summary.activeExceptions.length > 0
      ? summary.activeExceptions.map((item) => `- ${item}`)
      : ["- None"]),
    "",
    `Recommended Next Action: ${summary.recommendedNextAction}`,
    "",
    "Manual Actions",
    ...(summary.manualActions.length > 0
      ? summary.manualActions.map((item) => `- ${item}`)
      : ["- None"]),
    "",
  ];

  return lines.join("\n");
}
