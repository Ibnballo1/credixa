# Database Schema

Last updated: Phase 0 (planning only — no tables implemented yet)

This document tracks every table as it is implemented. Each phase that adds or
modifies a table updates this file with the actual DDL/Drizzle schema and a
rationale. Until a phase implements a table, it's listed here as planned only.

## Conventions (apply to every table)

- `id`: UUID primary key (generated), never expose sequential integer IDs
  externally.
- `created_at`, `updated_at`: timestamptz, not null.
- Foreign keys: `on delete restrict` by default for anything touching financial
  data — never cascade-delete financial records.
- Status/type fields: Postgres enums, not free-text strings.
- Every FK column and every column used in dashboard filtering gets an index.
- Financial records are immutable: no `deleted_at`, no hard deletes. Reversals
  are compensating ledger entries, not edits.

## Planned Tables

### Identity & Access (Phase 1)

- `users` — core identity, contact info, KYC status
- `roles` — enum-backed role catalog (customer, agent, admin)
- `user_roles` — many-to-many join, supports multi-role users
- `sessions` — Better Auth session store

### Wallet & Ledger (Phase 3)

- `wallets` — one per user/agent entity; cached `balance`, `currency`, `status`
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

- `notifications` — in-app/email/SMS records + delivery status
- `idempotency_keys` — shared idempotency primitive for all money-moving ops

## Changelog

- Phase 0: table inventory planned, no schema implemented yet.
