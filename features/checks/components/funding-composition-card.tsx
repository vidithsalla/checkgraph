type FundingCompositionCardProps = {
  depositCovered: string;
  hostedCovered: string;
  guestRemainder: string;
  reconciliationState: string;
};

export function FundingCompositionCard(props: FundingCompositionCardProps) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
        Funding Composition
      </h3>
      <dl className="mt-4 space-y-3 text-sm text-slate-300">
        <div className="flex items-center justify-between gap-4">
          <dt className="text-slate-500">Deposit covered</dt>
          <dd>{props.depositCovered}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-slate-500">Hosted covered</dt>
          <dd>{props.hostedCovered}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-slate-500">Guest-paid remainder</dt>
          <dd>{props.guestRemainder}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-slate-500">Funding reconciliation</dt>
          <dd>{props.reconciliationState}</dd>
        </div>
      </dl>
    </section>
  );
}
