type DepositStateCardProps = {
  depositRef: string;
  depositState: string;
  amount: string;
  applied: string;
  refundable: string;
};

export function DepositStateCard(props: DepositStateCardProps) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
        Deposit State
      </h3>
      <dl className="mt-4 space-y-3 text-sm text-slate-300">
        <div className="flex items-center justify-between gap-4">
          <dt className="text-slate-500">Deposit ref</dt>
          <dd>{props.depositRef}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-slate-500">State</dt>
          <dd>{props.depositState}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-slate-500">Amount</dt>
          <dd>{props.amount}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-slate-500">Applied</dt>
          <dd>{props.applied}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-slate-500">Refundable</dt>
          <dd>{props.refundable}</dd>
        </div>
      </dl>
    </section>
  );
}
