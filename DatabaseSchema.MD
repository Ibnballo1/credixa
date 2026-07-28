# Database Schema

Last updated: Phase 2

This document tracks every table as it is implemented. Each phase that adds or
modifies a table updates this file with the actual DDL/Drizzle schema and a
rationale. Until a phase implements a table, it's listed here as planned only.

## Conventions (apply to every table)

- `id`: UUID primary key (generated), never expose sequential integer IDs
  externally. **Exception:** `user`, `session`, `account`, `verification` use
  `text` IDs because Better Auth generates and manages these itself as part
  of its adapter contract — overriding that to force UUIDs would fight the
  library rather than configure it. Every table Credixa owns outright
  (`wallet`, `notification`, and everything from Phase 3 onward) uses UUID.
- `created_at`, `updated_at`: timestamptz, not null.
- Foreign keys: `on delete restrict` by default for anything touching financial
  data — never cascade-delete financial records.
- Status/type fields: Postgres enums, not free-text strings.
- Every FK column and every column used in dashboard filtering gets an index.
- Financial records are immutable: no `deleted_at`, no hard deletes. Reversals
  are compensating ledger entries, not edits.

## Implemented Tables (Phase 1–2)

- `user` — core identity (id, name, email, emailVerified, image), plus:
  - Better Auth `admin` plugin fields: `role` (`credixa_role` enum:
    customer | agent | admin, default customer), `banned`, `banReason`,
    `banExpires`
  - Credixa custom fields: `phone` (unique), `kycStatus`
    (`credixa_kyc_status` enum: unverified | pending | verified | rejected)
- `session` — Better Auth session store (id, userId, token, expiresAt,
  ipAddress, userAgent, impersonatedBy)
- `account` — Better Auth credential/OAuth account records (id, userId,
  accountId, providerId, password, OAuth tokens)
- `verification` — Better Auth email/token verification records
- `wallet` — one row per user, `balance` (integer kobo, always 0 in Phase 2
  — no write path exists yet), `currency`, `status`. Created lazily via
  `getOrCreateWallet()`. See `docs/wallet-ledger.md` for how Phase 3
  converts this into the real ledger-backed balance.
- `notification` — in-app notifications (type, title, body, readAt).
  Nothing writes to this table yet; the dashboard's notification bell
  renders a genuine empty state against it.

**Change from Phase 0 plan:** the originally-planned `roles` +
`user_roles` join table was replaced by a single `role` enum column on
`user`, populated via Better Auth's `admin` plugin — see
`docs/decisions/0003-rbac-via-admin-plugin.md` for the rationale.

## Planned Tables (later phases)

### Wallet & Ledger (Phase 3)

- `wallet` — implemented in Phase 2 (see above), balance-mutation path still absent
- `wallet_transactions` — immutable ledger; every credit/debit with
  `balance_before`, `balance_after`, `reference`, `idempotency_key`
- `wallet_holds` — pending debits not yet settled (VTU purchases in flight)

### Payments (Phase 4)

- `payment_webhooks` — raw inbound webhook payloads, verification status,
  processing state
- `transactions` — user-facing financial transaction records, linked to
  `wallet_transactions`

### VTU / Services (Phase 5)

- `services` — airtime/data/electricity/cable catalog
- `providers` — ClubKonnect, SMEPlug, etc., with capability flags
- `provider_transactions` — raw request/response audit trail per provider call
- `pricing_rules` — unified pricing engine (base / tier / agent-specific)

### Admin (Phase 6)

- `audit_logs` — every privileged action, immutable

### Agents & Referrals (Phase 7)

- `agents` — agent profile, tier, linked wallet
- `referrals` — referrer → referred user linkage
- `commissions` — polymorphic (agent_margin | referral), source reference

### Cross-cutting

- `idempotency_keys` — shared idempotency primitive for all money-moving ops

## Changelog

- Phase 0: table inventory planned, no schema implemented yet.
- Phase 1: implemented `user`, `session`, `account`, `verification` via
  Drizzle + Better Auth's Drizzle adapter and `admin` plugin. Replaced
  planned `roles`/`user_roles` tables with a `role` enum column (see ADR
  0003).
- Phase 2: implemented `wallet` (balance always 0 — no mutation path
  exists yet) and `notification` (nothing writes to it yet). Deliberately
  did NOT implement `transactions` — see
  `apps/web/src/features/transactions/services/transaction-service.ts`
  header comment for why that's staying UI-only until Phase 4/5.
