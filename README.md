# Credixa — Documentation

Modern Digital Payment Platform

Monorepo powered by:

- Next.js
- Turborepo
- pnpm
- Drizzle
- Supabase
- Better Auth

This is the living documentation for Credixa. It is updated alongside every phase of
development — every architectural decision, database change, API contract, and
deployment step gets recorded here as it happens, not retroactively.

## Structure

- `architecture-overview.md` — system architecture, roadmap, critique log
- `database-schema.md` — full schema, table-by-table, updated as tables are added
- `wallet-ledger.md` — wallet/ledger invariants and transaction flow
- `vtu-provider-adapter.md` — provider adapter/router pattern
- `background-jobs.md` — Inngest function catalog
- `environment-variables.md` — full env var reference
- `security.md` — security posture, OWASP checklist status
- `decisions/` — Architecture Decision Records (ADRs), one file per significant decision

## Status

| Phase                     | Status                          |
| ------------------------- | ------------------------------- |
| 0 — Foundation & Planning | ✅ Complete (this document set) |
| 1 — Auth & Roles          | ⏳ Not started                  |
| 2 — Customer Dashboard    | ⏳ Not started                  |
| 3 — Wallet & Ledger       | ⏳ Not started                  |
| 4 — Payments              | ⏳ Not started                  |
| 5 — VTU Services          | ⏳ Not started                  |
| 6 — Admin Dashboard       | ⏳ Not started                  |
| 7 — Agent Platform        | ⏳ Not started                  |
| 8 — Advanced Features     | ⏳ Not started                  |

## Convention

Every doc file has a "Last updated: Phase N" marker at the top so it's clear which
phase last touched it. When a phase modifies an existing table, pattern, or contract,
the corresponding doc is edited in place (not duplicated) and the change is noted
under a "## Changelog" section at the bottom of that file.
