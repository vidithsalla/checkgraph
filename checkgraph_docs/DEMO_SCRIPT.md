# Checkgraph Demo Script

Checkgraph is an event-driven prototype for restaurant check recovery and funding reconciliation.

The core idea is that messy check issues are usually state-coordination problems, not one-off payment bugs.
Instead of treating each issue separately, the system treats check events as the source of truth, recomputes derived state, surfaces explicit exceptions, and records audited operator actions.
The goal is to make ambiguous payment, deposit, and hosted-funding states legible enough for operators and support to recover them quickly. The packaged app also includes a mounted `Mark Payment Confirmed` recovery flow for fallback and terminal-degradation cases, but the fastest demo path stays focused on the three strongest hosted/deposit flows.

I start with the hosted deposit unapplied check, `CHK-ORE-20260330-011`.
This booking already has a captured deposit, but none of it has been applied to the final check yet, so the funding composition is wrong and the system raises an exception.
When I apply the deposit, the app writes a real event, updates the projections, clears the exception, and regenerates the support summary without pretending the external payment state changed.

Then I move to the hosted partial coverage check, `CHK-ORE-20260330-022`.
Here the deposit is already applied, but the booking also has hosted coverage that has not been applied yet, so the guest-paid remainder is still too high.
Applying hosted coverage writes another event, updates the allocation projection, and recalculates the remaining guest-paid balance.

Finally, I open the cancelled booking scenario, `CHK-ORE-20260331-033`.
This one shows a captured deposit on a cancelled booking, which is no longer a guest-payment problem. It becomes a recovery and follow-through problem.
Marking the deposit for refund moves the deposit state into `refund_pending`, clears the exception, and changes the operator story from manager triage to refund follow-through pending.

The main architecture point is that all three flows use the same loop: append an event, recompute state, update projections, and regenerate a support-facing explanation.

## 30-second version

Checkgraph is an event-driven restaurant check recovery prototype for messy states like unapplied deposits, partial hosted coverage, and cancelled bookings with unresolved deposits.

I usually show three checks.
First, a captured deposit that has not been applied to the final check yet.
Second, a hosted event where the deposit is applied but hosted coverage is still missing.
Third, a cancelled booking where the deposit has to move into refund follow-through.

In each case, the operator action writes a real DB event, recomputes derived state, updates projections and exceptions, and regenerates the support summary.
