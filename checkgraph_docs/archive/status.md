# Checkgraph Build Status

Archived note:
This file captures an earlier build-status snapshot from before the current hosted/deposit packaging pass. For the current public prototype, use the active docs in the parent `checkgraph_docs/` folder.

Locked pre-build contract at the time: `../PRE_BUILD_DECISIONS.md`

## Current
- Completed: locked pre-build decisions; Phase 1 foundation work for schema, enums/types, baseline migration, canonical seed scenario scaffolding, dependency install, and build validation; Phase 2 pure reducer, exception detection engine, rules-based identity suggestion engine, and seeded scenario expectation tests; Phase 3 minimal inspection UI for Overview, Exception Queue, and Check Detail; one vertical slice for DB-backed reads, audited manual override write, recompute, persisted exception updates, and support export
- In progress: none
- Blocked: none
- Deviations from spec: none
- Next step: if continuing, replace the remaining synthetic workflow edges with live DB-backed seed execution in a real Postgres environment, then extend the same write-path pattern to additional override types and replay

## Vertical Slice
- Truly end-to-end: DB-backed Overview, Exception Queue, and Check Detail reads; seed-to-projection recompute path; manager payment-confirmation override from Check Detail; override event write; audit log write; derived state recompute; exception persistence update; markdown and plain-text support export
- Still read-only: Overview metrics, Exception Queue triage, timeline inspection, identity panel data, and active exception display
- Still mocked or synthetic: scenario source data remains seeded/synthetic; no real payment processor, POS, or reservation integrations; no auth; no replay write path yet; DB seed could not be executed in this sandbox because no local Postgres instance is available
