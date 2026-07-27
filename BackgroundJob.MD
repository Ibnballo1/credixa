# Background Job Architecture (Inngest)

Last updated: Phase 0 (design — functions implemented per phase as needed)

## Why Inngest, not GitHub Actions

GitHub Actions has no durable execution model for business events — no
per-run state, no exponential backoff tied to a specific transaction. Inngest
provides step functions with automatic retries, backoff, and per-run
observability, which financial reconciliation and provider retry logic require.

GitHub Actions remains scoped to: CI/CD, automated testing, deployment, and
scheduled maintenance scripts — never application background jobs.

## Function Catalog

| Function                       | Trigger                          | Purpose                                                                          | Phase                       |
| ------------------------------ | -------------------------------- | -------------------------------------------------------------------------------- | --------------------------- |
| `retry-failed-vtu-transaction` | Provider call fails transiently  | Retry with backoff, escalate to failover provider, release hold if all fail      | 5                           |
| `retry-failed-webhook`         | Webhook processing fails         | Durable retry independent of Paystack's own retry                                | 4                           |
| `pending-transaction-sweep`    | Scheduled                        | Force status check on transactions stuck pending beyond threshold                | 5                           |
| `wallet-reconciliation`        | Scheduled                        | Recompute balances from ledger, alert on drift                                   | 3                           |
| `commission-calculation`       | Qualifying transaction completed | Compute and credit agent/referral commissions                                    | 7                           |
| `notification-dispatch`        | Business event                   | Decouple event from SMS/email delivery so provider outages don't block core flow | 8 (used earlier internally) |

## Location

Function definitions live in `packages/lib/src/jobs/` initially; will be split
into a dedicated `inngest/` package if function count/complexity grows during
Phase 5+.

## Changelog

- Phase 0: catalog defined, pending implementation per phase.
