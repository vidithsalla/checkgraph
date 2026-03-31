import Link from "next/link";

function formatMoney(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export function ExceptionQueueTable(props: {
  rows: Array<{
    checkId: string;
    scenarioId: string;
    restaurantName: string;
    tableLabel: string;
    severity: string;
    type: string;
    recommendedOwner: string;
    totalAmountCents: number;
    detectedAt: string;
  }>;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
      <table className="min-w-full divide-y divide-white/10 text-left text-sm">
        <thead className="bg-white/5 text-slate-400">
          <tr>
            <th className="px-4 py-3 font-medium">Severity</th>
            <th className="px-4 py-3 font-medium">Exception</th>
            <th className="px-4 py-3 font-medium">Restaurant</th>
            <th className="px-4 py-3 font-medium">Check</th>
            <th className="px-4 py-3 font-medium">Owner</th>
            <th className="px-4 py-3 font-medium">Amount</th>
            <th className="px-4 py-3 font-medium">Detected</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/6">
          {props.rows.map((row) => (
            <tr key={`${row.checkId}-${row.type}`} className="hover:bg-white/4">
              <td className="px-4 py-3 text-slate-200">{row.severity}</td>
              <td className="px-4 py-3 text-slate-100">{row.type}</td>
              <td className="px-4 py-3 text-slate-400">
                {row.restaurantName} • {row.tableLabel}
              </td>
              <td className="px-4 py-3">
                <Link
                  href={`/checks/${row.checkId}`}
                  className="text-sky-300 transition hover:text-sky-200"
                >
                  {row.checkId}
                </Link>
              </td>
              <td className="px-4 py-3 text-slate-300">{row.recommendedOwner}</td>
              <td className="px-4 py-3 text-slate-300">{formatMoney(row.totalAmountCents)}</td>
              <td className="px-4 py-3 text-slate-500">{row.detectedAt}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
