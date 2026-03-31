function formatMoney(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export function CheckHeader(props: {
  checkId: string;
  restaurantName: string;
  tableLabel: string;
  totalAmountCents: number;
  paymentState: string;
  exceptionState: string;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
        Check Detail
      </p>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-50">{props.checkId}</h2>
          <p className="mt-1 text-sm text-slate-400">
            {props.restaurantName} • {props.tableLabel}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-semibold text-slate-50">
            {formatMoney(props.totalAmountCents)}
          </p>
          <p className="mt-1 text-sm text-slate-400">
            Payment: {props.paymentState} • Severity: {props.exceptionState}
          </p>
        </div>
      </div>
    </section>
  );
}
