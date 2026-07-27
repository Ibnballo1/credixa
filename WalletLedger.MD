# Wallet Ledger Architecture

Last updated: Phase 0 (design — implementation in Phase 3)

## Core Invariant

`wallets.balance` is a cache, never a source of truth. It is only ever updated
inside the same database transaction that inserts the `wallet_transactions` row
that justifies the new value, computed as:

```
new_balance = previous_balance + signed_amount
```

Never set directly to an arbitrary value.

## Standard Flow (any wallet-affecting operation)

1. Caller provides or the system generates an **idempotency key**.
2. Check `idempotency_keys` for this key inside the transaction that follows —
   if already processed, return the prior result (no-op).
3. Open a DB transaction.
4. `SELECT ... FOR UPDATE` the wallet row (row-level lock, prevents concurrent
   debits racing on the same wallet).
5. Validate sufficient balance (debits) or limits (credits).
6. Insert the `wallet_transactions` row — immutable, includes `balance_before`,
   `balance_after`, `reference`, `idempotency_key`.
7. Update `wallets.balance`.
8. Insert `audit_logs` entry.
9. Commit.

## VTU Purchases: Hold → Finalize/Release

VTU purchases can't debit-then-confirm safely, because provider success is
unknown at initiation time. Instead:

1. Purchase initiated → `wallet_holds` row created, balance reduced by hold
   amount (shown to user as unavailable, no `wallet_transactions` row yet).
2. Provider succeeds → hold converted into a finalized `wallet_transactions`
   debit.
3. Provider fails/times out → hold released, balance restored, no ledger debit.
   A "hold released" audit event is still logged.

## Reversals

Never delete or edit historical `wallet_transactions` rows. A reversal is a new,
opposite-signed row referencing the original transaction's reference.

## Reconciliation

A scheduled Inngest job (`wallet-reconciliation`) recomputes each wallet's
balance by summing `wallet_transactions` and compares it against the cached
`wallets.balance`. Any drift triggers an alert. This is the safety net against
any bug that violates the core invariant above.

## Changelog

- Phase 0: design finalized, pending Phase 3 implementation.
