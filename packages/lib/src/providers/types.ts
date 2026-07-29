// File: packages/lib/src/providers/types.ts
// Purpose: The provider-agnostic contract. Business logic
//          (packages/lib/src/vtu/purchase-service.ts) depends ONLY on
//          this interface and on ProviderRouter — never on
//          ClubKonnectAdapter or SMEPlugAdapter directly. Adding a third
//          provider later means writing one new adapter file and
//          registering it with the router; zero changes to purchase
//          logic. See docs/vtu-provider-adapter.md.

export type VtuServiceType = "airtime" | "data" | "electricity" | "cable";

export interface PurchaseRequest {
  type: VtuServiceType;
  /** Network code (MTN/AIRTEL/GLO/9MOBILE), disco code, or cable provider — matches `service.network`. */
  network: string;
  amountKobo: number;
  /** Our own reference — passed to the provider where supported, for their-side tracking/idempotency. */
  requestReference: string;
  recipientPhone?: string;
  recipientMeterNumber?: string;
  recipientSmartCardNumber?: string;
  /** The provider-specific plan code for data/cable — `service.providerPlanCode`. */
  providerPlanCode?: string;
}

export type PurchaseOutcome =
  | { status: "success"; providerReference: string | null; raw: unknown }
  | { status: "failed"; reason: string; raw: unknown }
  /** Provider acknowledged receipt but settles asynchronously — not yet
   * a final answer. The caller must check back later (via checkStatus). */
  | { status: "pending"; providerReference: string | null; raw: unknown };

export interface ProviderAdapter {
  readonly providerName: string;
  supports(type: VtuServiceType): boolean;
  purchase(request: PurchaseRequest): Promise<PurchaseOutcome>;
  /** Re-queries the provider for a previously-submitted order's current
   * status — used by the retry job and reconciliation, not the initial
   * purchase attempt. */
  checkStatus(providerReference: string): Promise<PurchaseOutcome>;
}

/**
 * Strips credentials from a request payload before it's stored in
 * `provider_transaction.request_payload` — that table is an audit trail
 * meant to be readable by support/admin staff later (Phase 6), and
 * should never contain a live API key.
 */
export function redactRequestForLogging(
  payload: Record<string, unknown>,
  sensitiveKeys: string[],
): Record<string, unknown> {
  const redacted = { ...payload };
  for (const key of sensitiveKeys) {
    if (key in redacted) {
      redacted[key] = "[redacted]";
    }
  }
  return redacted;
}
