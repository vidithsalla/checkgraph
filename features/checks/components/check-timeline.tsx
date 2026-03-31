export function CheckTimeline(props: {
  events: Array<{
    sequenceNo: number;
    type: string;
    eventGroup: string;
    occurredAt: string;
  }>;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
        Timeline
      </h3>
      <div className="mt-4 space-y-3">
        {props.events.map((event) => (
          <div
            key={`${event.sequenceNo}-${event.type}`}
            className="rounded-xl border border-white/8 bg-black/10 px-4 py-3"
          >
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-medium text-slate-100">
                {event.sequenceNo}. {event.type}
              </p>
              <span className="rounded-full border border-white/10 px-2 py-1 text-xs uppercase tracking-[0.16em] text-slate-400">
                {event.eventGroup}
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-500">{event.occurredAt}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
