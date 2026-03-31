type GuestRolesCardProps = {
  organizerGuest: string;
  reservationGuest: string;
  payerGuest: string;
  primaryGuest: string;
  roleResolutionState: string;
};

export function GuestRolesCard(props: GuestRolesCardProps) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
        Guest Roles
      </h3>
      <dl className="mt-4 space-y-3 text-sm text-slate-300">
        <div className="flex items-center justify-between gap-4">
          <dt className="text-slate-500">Organizer</dt>
          <dd>{props.organizerGuest}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-slate-500">Reservation</dt>
          <dd>{props.reservationGuest}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-slate-500">Payer</dt>
          <dd>{props.payerGuest}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-slate-500">Primary</dt>
          <dd>{props.primaryGuest}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-slate-500">Resolution</dt>
          <dd>{props.roleResolutionState}</dd>
        </div>
      </dl>
    </section>
  );
}
