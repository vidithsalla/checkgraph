type BookingContextCardProps = {
  bookingRef: string;
  bookingName: string;
  bookingStatus: string;
  bookingType: string;
  eventDate?: string;
  partySize?: number | null;
};

export function BookingContextCard(props: BookingContextCardProps) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
        Booking Context
      </h3>
      <dl className="mt-4 space-y-3 text-sm text-slate-300">
        <div className="flex items-center justify-between gap-4">
          <dt className="text-slate-500">Booking ref</dt>
          <dd>{props.bookingRef}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-slate-500">Booking</dt>
          <dd>{props.bookingName}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-slate-500">Status</dt>
          <dd>{props.bookingStatus}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-slate-500">Type</dt>
          <dd>{props.bookingType}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-slate-500">Event date</dt>
          <dd>{props.eventDate ?? "Not set"}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-slate-500">Party size</dt>
          <dd>{props.partySize ?? "Unknown"}</dd>
        </div>
      </dl>
    </section>
  );
}
