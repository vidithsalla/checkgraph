import Link from "next/link";
import { ExceptionQueueTable } from "@/features/exceptions/components/exception-queue-table";
import { loadChecksOverview } from "@/lib/server/checks/load-checks";
import { loadActiveExceptions } from "@/lib/server/checks/load-exceptions";

export const dynamic = "force-dynamic";

function formatMoney(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export default async function OverviewPage() {
  const [checks, exceptions] = await Promise.all([
    loadChecksOverview(),
    loadActiveExceptions(),
  ]);

  const stats = [
    { label: "Checks", value: checks.length.toString() },
    { label: "Open Exceptions", value: exceptions.length.toString() },
    {
      label: "Urgent",
      value: exceptions.filter((exception) => exception.severity === "urgent").length.toString(),
    },
    {
      label: "Awaiting Receipt",
      value: checks
        .filter(
          (check) =>
            check.derivedState?.receiptState === "pending" ||
            check.derivedState?.receiptState === "missing_after_timeout",
        )
        .length.toString(),
    },
  ];

  return (
    <main className="space-y-6">
      <section className="grid gap-4 md:grid-cols-4">
        {stats.map((stat) => (
          <article
            key={stat.label}
            className="rounded-2xl border border-white/10 bg-white/5 p-5"
          >
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              {stat.label}
            </p>
            <p className="mt-3 text-3xl font-semibold text-slate-50">{stat.value}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-50">Active Exceptions</h2>
            <Link href="/exceptions" className="text-sm text-sky-300 hover:text-sky-200">
              Open queue
            </Link>
          </div>
          <div className="mt-4">
            <ExceptionQueueTable rows={exceptions.slice(0, 6)} />
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-lg font-semibold text-slate-50">Checks</h2>
          <div className="mt-4 space-y-3">
            {checks.map((check) => (
              <Link
                key={check.id}
                href={`/checks/${check.id}`}
                className="block rounded-xl border border-white/8 bg-black/10 px-4 py-3 transition hover:border-slate-500"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-slate-100">{check.id}</p>
                    <p className="mt-1 text-sm text-slate-400">
                      {check.restaurantName} • {check.scenarioId ?? "seeded check"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-100">
                      {formatMoney(check.totalAmountCents)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {check.derivedState?.paymentState ?? "unknown"} •{" "}
                      {check.derivedState?.exceptionState ?? "none"}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
