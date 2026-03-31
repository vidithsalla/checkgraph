import type { SupportSummary } from "./generate-support-summary";

export function exportSupportSummaryMarkdown(summary: SupportSummary) {
  const section = (title: string, items: string[]) => {
    if (items.length === 0) {
      return `## ${title}\n- None`;
    }

    return `## ${title}\n${items.map((item) => `- ${item}`).join("\n")}`;
  };

  return [
    "# Support Summary",
    "",
    `Check ID: ${summary.checkId}`,
    `Restaurant: ${summary.restaurant}`,
    `Table: ${summary.tableLabel}`,
    `Total: ${summary.total}`,
    "",
    section("Booking Summary", summary.bookingSummary),
    "",
    section("Deposit Summary", summary.depositSummary),
    "",
    section("Funding Summary", summary.fundingSummary),
    "",
    section("Payment Summary", summary.paymentSummary),
    "",
    section("Receipt Summary", summary.receiptSummary),
    "",
    section("Rewards Summary", summary.rewardsSummary),
    "",
    section("Identity Summary", summary.identitySummary),
    "",
    section("Guest Roles", summary.guestRoleSummary),
    "",
    section("Active Exceptions", summary.activeExceptions),
    "",
    "## Recommended Next Action",
    `- ${summary.recommendedNextAction}`,
    "",
    section("Manual Actions", summary.manualActions),
    "",
  ].join("\n");
}
