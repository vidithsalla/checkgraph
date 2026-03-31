export function CheckStateCard(props: {
  paymentState: string;
  receiptState: string;
  rewardsState: string;
  identityState: string;
  serviceState: string;
  serviceStateDetail?: string;
  nextActionOwner?: string;
  nextActionText?: string;
}) {
  const rows = [
    ["Payment", props.paymentState],
    ["Receipt", props.receiptState],
    ["Rewards", props.rewardsState],
    ["Identity", props.identityState],
    ["Service", props.serviceState],
  ];

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
        Derived State
      </h3>
      <div className="mt-4 space-y-3">
        {rows.map(([label, value]) => (
          <div key={label} className="text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">{label}</span>
              <span className="rounded-full border border-white/10 px-3 py-1 text-slate-100">
                {value}
              </span>
            </div>
            {label === "Service" && props.serviceStateDetail ? (
              <p className="mt-2 text-xs leading-5 text-slate-500">
                {props.serviceStateDetail}
              </p>
            ) : null}
          </div>
        ))}
      </div>
      <div className="mt-5 border-t border-white/10 pt-4">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
          Next Action
        </p>
        <p className="mt-2 text-sm font-medium text-slate-200">
          {props.nextActionOwner ?? "none"}
        </p>
        <p className="mt-1 text-sm leading-6 text-slate-400">
          {props.nextActionText ?? "No action required."}
        </p>
      </div>
    </section>
  );
}
