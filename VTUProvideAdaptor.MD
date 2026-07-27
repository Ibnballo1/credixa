# VTU Provider Adapter Architecture

Last updated: Phase 0 (design — implementation in Phase 5)

## Layering

```
Business logic (features/vtu/services)
        ↓ depends only on
ProviderRouter
        ↓ selects provider by capability / cost / health, handles failover
ProviderAdapter interface  (purchaseAirtime, purchaseData, payElectricity,
                             payCableTV, checkStatus)
        ↓ implemented by
ClubKonnectAdapter    SMEPlugAdapter    [FutureProviderAdapter]
```

## Responsibilities

- **`ProviderAdapter` interface** (`packages/lib/src/providers/types.ts`): every
  provider implements identical method signatures and returns a normalized
  result/error shape, regardless of the underlying provider's actual API.
- **Adapters**: translate Credixa's normalized request into the provider's real
  API contract, and translate provider-specific errors into Credixa's normalized
  error taxonomy (insufficient provider balance, invalid recipient, timeout,
  etc.). Business logic never sees provider-specific codes.
- **`ProviderRouter`**: owns which provider serves which network/service
  combination, cost-based selection when multiple providers support the same
  service, and failover — if the primary provider errors or times out, retry
  against the secondary provider. Retries are durable (via Inngest), not inline
  blocking retries.
- **`provider_transactions`**: records raw request/response for every provider
  call regardless of business-transaction outcome — this is the reconciliation
  and dispute-resolution source of truth for provider interactions specifically
  (distinct from `transactions`, which is the user-facing financial record).

## Why business logic never imports a specific adapter

Adding a third provider means writing one new adapter file and registering it
with the router — zero changes to purchase logic in `features/vtu/services`.
This is the mechanism that satisfies the "no major architectural changes" goal
in the product brief for future providers or services.

## Changelog

- Phase 0: design finalized, pending Phase 5 implementation.
