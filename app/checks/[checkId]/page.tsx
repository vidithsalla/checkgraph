import { notFound } from "next/navigation";
import { applyPaymentOverride } from "@/features/checks/actions/apply-payment-override";
import { applyDepositToCheck } from "@/features/checks/actions/apply-deposit-to-check";
import { applyHostedCoverageToCheck } from "@/features/checks/actions/apply-hosted-coverage-to-check";
import { markDepositForRefund } from "@/features/checks/actions/mark-deposit-for-refund";
import { BookingContextCard } from "@/features/checks/components/booking-context-card";
import { CheckHeader } from "@/features/checks/components/check-header";
import { CheckStateCard } from "@/features/checks/components/check-state-card";
import { CheckTimeline } from "@/features/checks/components/check-timeline";
import { DepositStateCard } from "@/features/checks/components/deposit-state-card";
import { FundingCompositionCard } from "@/features/checks/components/funding-composition-card";
import { GuardedActionForm } from "@/features/checks/components/guarded-action-form";
import { GuestRolesCard } from "@/features/checks/components/guest-roles-card";
import { describeFundingReconciliationState } from "@/lib/domain/allocations/describe-funding-reconciliation-state";
import { describeServiceState } from "@/lib/domain/state/describe-service-state";
import { loadCheckDetail } from "@/lib/server/checks/load-check-detail";

export const dynamic = "force-dynamic";

function formatMoney(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export default async function CheckDetailPage({
  params,
}: {
  params: Promise<{ checkId: string }>;
}) {
  const { checkId } = await params;
  const detail = await loadCheckDetail(checkId);

  if (!detail) {
    notFound();
  }

  const primaryDeposit = detail.bookingDeposits[0] ?? null;
  const unappliedDepositAmount = primaryDeposit
    ? Math.max(0, primaryDeposit.amountCents - primaryDeposit.appliedAmountCents)
    : 0;
  const unappliedHostedAmount = detail.booking
    ? Math.max(
        0,
        detail.booking.hostedAmountCents - (detail.derivedState?.hostedAppliedAmountCents ?? 0),
      )
    : 0;
  const refundableDepositAmount = primaryDeposit?.refundableAmountCents ?? 0;
  const fallbackExceptionTypes = new Set([
    "network_degraded_during_payment",
    "terminal_offline_during_close",
    "fallback_mode_unresolved",
  ]);
  const activeFallbackExceptions = detail.activeExceptions.filter((exception) =>
    fallbackExceptionTypes.has(exception.exceptionType),
  );
  const paymentConfirmationAvailable =
    activeFallbackExceptions.length > 0 &&
    detail.derivedState?.paymentState !== "closed" &&
    detail.derivedState?.serviceState !== "completed";
  const cancelledBookingNeedsRefund =
    detail.booking?.status === "cancelled" &&
    primaryDeposit !== null &&
    refundableDepositAmount > 0 &&
    (detail.derivedState?.depositState === "captured" ||
      detail.derivedState?.depositState === "hold_active");
  const primaryGuest =
    (detail.derivedState?.primaryGuestId &&
      detail.guestsById.get(detail.derivedState.primaryGuestId)?.displayName) ??
    "Unlinked";
  const payerGuest =
    (detail.derivedState?.payerGuestId &&
      detail.guestsById.get(detail.derivedState.payerGuestId)?.displayName) ??
    "Unknown";
  const reservationGuest =
    (detail.derivedState?.reservationGuestId &&
      detail.guestsById.get(detail.derivedState.reservationGuestId)?.displayName) ??
    "None";
  const organizerGuest =
    (detail.derivedState?.organizerGuestId &&
      detail.guestsById.get(detail.derivedState.organizerGuestId)?.displayName) ??
    "None";
  const serviceStateDescription = describeServiceState({
    serviceState: detail.derivedState?.serviceState ?? null,
    bookingStatus: detail.booking?.status ?? null,
    depositState: detail.derivedState?.depositState ?? null,
  });

  return (
    <main className="space-y-6">
      <CheckHeader
        checkId={detail.check.externalCheckRef}
        restaurantName={detail.restaurant.name}
        tableLabel={detail.check.tableLabel ?? detail.check.serviceChannel}
        totalAmountCents={detail.check.totalAmountCents}
        paymentState={detail.derivedState?.paymentState ?? "unknown"}
        exceptionState={detail.derivedState?.exceptionState ?? "none"}
      />

      <section className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <CheckTimeline
          events={detail.timeline.map((event) => ({
            sequenceNo: event.sequenceNo,
            type: event.eventType,
            eventGroup: event.eventGroup,
            occurredAt: event.occurredAt.toISOString(),
          }))}
        />
        <div className="space-y-6">
          <CheckStateCard
            paymentState={detail.derivedState?.paymentState ?? "unknown"}
            receiptState={detail.derivedState?.receiptState ?? "unknown"}
            rewardsState={detail.derivedState?.rewardsState ?? "unknown"}
            identityState={detail.derivedState?.identityState ?? "unknown"}
            serviceState={serviceStateDescription.label}
            serviceStateDetail={serviceStateDescription.detail}
            nextActionOwner={detail.derivedState?.nextActionOwner ?? undefined}
            nextActionText={detail.derivedState?.nextActionText ?? undefined}
          />
          {detail.booking ? (
            <BookingContextCard
              bookingRef={detail.booking.bookingRef}
              bookingName={detail.booking.eventName}
              bookingStatus={detail.booking.status}
              bookingType={detail.booking.bookingType}
              eventDate={detail.booking.eventDate?.toISOString()}
              partySize={detail.booking.partySize}
            />
          ) : null}
          {primaryDeposit ? (
            <DepositStateCard
              depositRef={primaryDeposit.depositRef}
              depositState={detail.derivedState?.depositState ?? primaryDeposit.state}
              amount={formatMoney(primaryDeposit.amountCents)}
              applied={formatMoney(primaryDeposit.appliedAmountCents)}
              refundable={formatMoney(primaryDeposit.refundableAmountCents)}
            />
          ) : null}
          <FundingCompositionCard
            depositCovered={formatMoney(detail.derivedState?.depositAppliedAmountCents ?? 0)}
            hostedCovered={formatMoney(detail.derivedState?.hostedAppliedAmountCents ?? 0)}
            guestRemainder={formatMoney(
              detail.derivedState?.directPaymentDueCents ?? detail.check.totalAmountCents,
            )}
            reconciliationState={describeFundingReconciliationState(
              detail.derivedState?.hostedSettlementState,
            )}
          />
          <GuestRolesCard
            organizerGuest={organizerGuest}
            reservationGuest={reservationGuest}
            payerGuest={payerGuest}
            primaryGuest={primaryGuest}
            roleResolutionState={detail.derivedState?.roleResolutionState ?? "not_set"}
          />
          <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
              Mark Payment Confirmed
            </h3>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Record a manual payment confirmation for active fallback or terminal-degradation cases
              without rewriting external payment lifecycle truth.
            </p>
            {paymentConfirmationAvailable ? (
              <GuardedActionForm
                action={applyPaymentOverride}
                hiddenFields={[
                  { name: "checkId", value: detail.check.id },
                  { name: "externalCheckRef", value: detail.check.externalCheckRef },
                ]}
                summary={`Clearing ${activeFallbackExceptions.length} fallback-related exception${activeFallbackExceptions.length === 1 ? "" : "s"} on ${detail.check.externalCheckRef}`}
                placeholder="Reason for manual payment confirmation"
                buttonLabel="Mark Payment Confirmed"
                pendingLabel="Confirming Payment..."
                buttonClassName="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-100 transition hover:border-emerald-400 hover:bg-emerald-500/15"
              />
            ) : (
              <p className="mt-4 text-sm text-slate-400">
                No active fallback or terminal-degradation payment confirmation action is currently
                required for this check.
              </p>
            )}
          </section>
          <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
              Apply Deposit To Check
            </h3>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Apply a captured booking deposit to the final check without rewriting
              external payment authorization truth.
            </p>
            {detail.booking &&
            detail.booking.status !== "cancelled" &&
            primaryDeposit &&
            unappliedDepositAmount > 0 ? (
              <GuardedActionForm
                action={applyDepositToCheck}
                hiddenFields={[
                  { name: "checkId", value: detail.check.id },
                  { name: "externalCheckRef", value: detail.check.externalCheckRef },
                  { name: "bookingRef", value: detail.booking.bookingRef },
                  { name: "depositRef", value: primaryDeposit.depositRef },
                  { name: "amountCents", value: unappliedDepositAmount },
                ]}
                summary={`Applying ${formatMoney(unappliedDepositAmount)} from ${primaryDeposit.depositRef}`}
                placeholder="Reason for deposit application"
                buttonLabel="Apply Deposit To Check"
                pendingLabel="Applying Deposit..."
                buttonClassName="rounded-full border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-100 transition hover:border-amber-400 hover:bg-amber-500/15"
              />
            ) : (
              <p className="mt-4 text-sm text-slate-400">
                {detail.booking?.status === "cancelled"
                  ? "Deposit application is disabled because this booking has been cancelled."
                  : "No unapplied captured deposit is currently available for this check."}
              </p>
            )}
          </section>
          <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
              Apply Hosted Coverage To Check
            </h3>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Apply confirmed hosted credit from the booking to reduce the remaining
              guest-paid balance without changing payment truth.
            </p>
            {detail.booking &&
            detail.booking.status !== "cancelled" &&
            unappliedHostedAmount > 0 ? (
              <GuardedActionForm
                action={applyHostedCoverageToCheck}
                hiddenFields={[
                  { name: "checkId", value: detail.check.id },
                  { name: "externalCheckRef", value: detail.check.externalCheckRef },
                  { name: "bookingRef", value: detail.booking.bookingRef },
                  { name: "amountCents", value: unappliedHostedAmount },
                ]}
                summary={`Applying ${formatMoney(unappliedHostedAmount)} of hosted coverage from ${detail.booking.bookingRef}`}
                placeholder="Reason for hosted coverage application"
                buttonLabel="Apply Hosted Coverage To Check"
                pendingLabel="Applying Hosted Coverage..."
                buttonClassName="rounded-full border border-sky-500/40 bg-sky-500/10 px-4 py-2 text-sm font-medium text-sky-100 transition hover:border-sky-400 hover:bg-sky-500/15"
              />
            ) : (
              <p className="mt-4 text-sm text-slate-400">
                {detail.booking?.status === "cancelled"
                  ? "Hosted coverage application is disabled because this booking has been cancelled."
                  : "No unapplied hosted coverage is currently available for this check."}
              </p>
            )}
          </section>
          <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
              Mark Deposit For Refund
            </h3>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Record that the cancelled booking deposit has moved into refund
              processing without implying that the refund is already complete.
            </p>
            {detail.booking && primaryDeposit && cancelledBookingNeedsRefund ? (
              <GuardedActionForm
                action={markDepositForRefund}
                hiddenFields={[
                  { name: "checkId", value: detail.check.id },
                  { name: "externalCheckRef", value: detail.check.externalCheckRef },
                  { name: "bookingRef", value: detail.booking.bookingRef },
                  { name: "depositRef", value: primaryDeposit.depositRef },
                  { name: "amountCents", value: refundableDepositAmount },
                ]}
                summary={`Marking ${formatMoney(refundableDepositAmount)} from ${primaryDeposit.depositRef} as refund pending for cancelled booking ${detail.booking.bookingRef}`}
                placeholder="Reason for marking the deposit for refund"
                buttonLabel="Mark Deposit For Refund"
                pendingLabel="Marking Refund Pending..."
                buttonClassName="rounded-full border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-100 transition hover:border-rose-400 hover:bg-rose-500/15"
              />
            ) : (
              <p className="mt-4 text-sm text-slate-400">
                No cancelled-booking deposit refund action is currently required for this
                check.
              </p>
            )}
          </section>
          <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
              Support Export
            </h3>
            <div className="mt-4 flex flex-wrap gap-3">
              <a
                href={`/api/checks/${detail.check.externalCheckRef}/support-export?format=markdown`}
                className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:border-slate-500"
              >
                Markdown
              </a>
              <a
                href={`/api/checks/${detail.check.externalCheckRef}/support-export?format=text`}
                className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:border-slate-500"
              >
                Plain Text
              </a>
            </div>
          </section>
          <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
              Active Exceptions
            </h3>
            <div className="mt-4 space-y-3">
              {detail.activeExceptions.length === 0 ? (
                <p className="text-sm text-slate-400">No active exceptions.</p>
              ) : (
                detail.activeExceptions.map((exception) => (
                  <div
                    key={exception.id}
                    className="rounded-xl border border-white/8 bg-black/10 px-4 py-3"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-sm font-medium text-slate-100">
                        {exception.exceptionType}
                      </p>
                      <span className="text-xs uppercase tracking-[0.16em] text-slate-500">
                        {exception.severity}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      {exception.explanationText}
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>
          <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
              Audit Trail
            </h3>
            <div className="mt-4 space-y-3">
              {detail.auditTrail.length === 0 ? (
                <p className="text-sm text-slate-400">No manual actions recorded.</p>
              ) : (
                detail.auditTrail.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-xl border border-white/8 bg-black/10 px-4 py-3"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-sm font-medium text-slate-100">
                        {entry.actionType}
                      </p>
                      <span className="text-xs uppercase tracking-[0.16em] text-slate-500">
                        {entry.actorRole}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      {entry.note ?? "No note"}
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
