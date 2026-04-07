"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { idleActionResult, type ActionResult } from "@/features/checks/actions/action-result";

type HiddenField = {
  name: string;
  value: string | number;
};

type GuardedActionFormProps = {
  action: (state: ActionResult, formData: FormData) => Promise<ActionResult>;
  hiddenFields: HiddenField[];
  summary: string;
  placeholder: string;
  buttonLabel: string;
  pendingLabel: string;
  buttonClassName: string;
};

function SubmitButton({
  label,
  pendingLabel,
  className,
}: {
  label: string;
  pendingLabel: string;
  className: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending} className={className} aria-disabled={pending}>
      {pending ? pendingLabel : label}
    </button>
  );
}

export function GuardedActionForm({
  action,
  hiddenFields,
  summary,
  placeholder,
  buttonLabel,
  pendingLabel,
  buttonClassName,
}: GuardedActionFormProps) {
  const [state, formAction] = useActionState(action, idleActionResult);

  return (
    <form action={formAction} className="mt-4 space-y-3">
      {hiddenFields.map((field) => (
        <input key={field.name} type="hidden" name={field.name} value={String(field.value)} />
      ))}
      <p className="rounded-xl border border-white/8 bg-black/10 px-4 py-3 text-sm text-slate-300">
        {summary}
      </p>
      <textarea
        name="reason"
        required
        minLength={10}
        className="min-h-28 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-500"
        placeholder={placeholder}
      />
      {state.status === "error" ? (
        <p className="rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {state.message}
        </p>
      ) : null}
      <SubmitButton
        label={buttonLabel}
        pendingLabel={pendingLabel}
        className={`${buttonClassName} disabled:cursor-not-allowed disabled:opacity-70`}
      />
    </form>
  );
}
