import { ExceptionQueueTable } from "@/features/exceptions/components/exception-queue-table";
import { loadActiveExceptions } from "@/lib/server/checks/load-exceptions";

export const dynamic = "force-dynamic";

export default async function ExceptionsPage() {
  const exceptions = await loadActiveExceptions();

  return (
    <main className="space-y-6">
      <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
          Exception Queue
        </p>
        <h2 className="mt-3 text-2xl font-semibold text-slate-50">
          Active operational exceptions
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
          DB-backed queue driven by persisted exceptions and derived state.
        </p>
      </section>
      <ExceptionQueueTable rows={exceptions} />
    </main>
  );
}
