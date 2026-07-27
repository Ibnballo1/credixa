# Architecture Overview

Last updated: Phase 0

## System Layers

```
UI (React Server/Client Components)
  ↓
Server Actions / Route Handlers
  ↓
Application Services (feature-level business logic)
  ↓
Repositories (packages/db)
  ↓
Drizzle ORM
  ↓
PostgreSQL (Supabase)
```

Rules:

- Business logic never lives in components.
- Components never query the database directly.
- Repositories are the only layer that talks to Drizzle.
- Both `apps/web` and `apps/admin` share `packages/db` repositories, guaranteeing
  identical business-rule enforcement regardless of which app initiates an action.

## Apps

- `apps/web` — customer + agent facing app (usecredixa.com)
- `apps/admin` — internal admin dashboard (separate deploy, separate domain)

Split rationale: independent deploy cadence, no admin secrets in the customer
bundle, smaller blast radius if either app is compromised.

## Monorepo Layout

```
credixa/
├── apps/
│   ├── web/
│   └── admin/
├── packages/
│   ├── auth/       # Better Auth config, session helpers, RBAC guards
│   ├── db/          # Drizzle schema, migrations, repositories
│   ├── ui/          # shared shadcn-based component library
│   ├── lib/         # payments, notifications, providers, logger
│   ├── config/      # env schema (Zod), shared constants
│   └── types/       # shared TypeScript types/DTOs
├── tooling/
├── docs/
└── inngest/ (or packages/lib/src/jobs)
```

Feature organization inside each app:

```
features/
  wallet/
    components/
    actions/
    services/
    schemas/
  payments/
  transactions/
  vtu/
  users/
  notifications/
  referrals/
```

## Roadmap

| Phase | Name                       | Depends on |
| ----- | -------------------------- | ---------- |
| 0     | Foundation & Planning      | —          |
| 1     | Auth & Roles               | 0          |
| 2     | Customer Dashboard (shell) | 1          |
| 3     | Wallet & Ledger            | 1          |
| 4     | Payments (Funding)         | 3          |
| 5     | VTU Services               | 3, 4       |
| 6     | Admin Dashboard            | 3–5        |
| 7     | Agent Platform             | 5, 6       |
| 8     | Advanced Features          | 6, 7       |

## Design Decisions Log (summary — full ADRs in decisions/)

1. **RBAC via `roles` + `user_roles` join table**, not a single `role` column on
   `users` — supports future multi-role users without migration.
2. **Wallet balance is a transactionally-maintained cache**, ledger is the source
   of truth; reconciliation job verifies the two never drift. See `wallet-ledger.md`.
3. **Provider routing layer above adapters** (`ProviderRouter`), not just adapters —
   needed for failover and cost-based routing. See `vtu-provider-adapter.md`.
4. **Single idempotency primitive** (`idempotency_keys` table + service wrapper)
   used by every money-moving operation, rather than reimplemented per feature.
5. **Unified pricing engine** — `pricing_rules` serves both Admin margin config
   and Agent tiered/discount pricing, avoiding two parallel systems.
6. **Commissions table is polymorphic** (`commission_type`: agent_margin |
   referral) but calculation logic stays in separate Inngest functions per type.
7. **`wallet_holds` + `provider_transactions`** added beyond the original table
   list — holds support debit-then-confirm for VTU purchases; provider_transactions
   separates the technical provider audit trail from the user-facing `transactions`
   table.
8. **Rate limiting / idempotency locks via Upstash Redis** — new dependency,
   chosen for native Vercel serverless/edge compatibility. Needs sign-off.
9. **Structured logging via `pino`** — new dependency, replaces console.log
   per the no-console.log requirement. Needs sign-off.
10. **Two separate Next.js apps** (web, admin) instead of one app with route-based
    role gating — see rationale above.

## Risks (tracked, revisited each phase)

- **Security**: webhook signature verification must be server-side only; strict
  cookie flags on sessions; admin/customer secret isolation via app split.
- **Scalability**: row-level locks on hot wallets are a future contention point;
  acceptable at launch scale, monitored via reconciliation job metrics.
- **Maintainability**: pricing engine resolution order (base → tier → agent
  override) needs strong test coverage from day one — a bug here is a revenue bug.
- **Extensibility**: ledger, provider adapter, and pricing engine are deliberately
  generic so future financial products (savings, loans, transfers) plug into
  existing architecture without redesign.

## Changelog

- Phase 0: initial document created.
