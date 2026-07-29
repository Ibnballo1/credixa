// File: packages/lib/src/providers/provider-router.ts
// Purpose: The layer business logic actually depends on — never a
//          specific adapter directly (see docs/vtu-provider-adapter.md).
//          Tries each active provider that supports the requested
//          service type, in priority order, escalating to the next only
//          on a definitive "failed" outcome.

import { db, createProviderRepository } from "@credixa/db";
import type {
  ProviderAdapter,
  PurchaseRequest,
  PurchaseOutcome,
} from "./types";
import { clubKonnectAdapter } from "./clubkonnect-adapter";
import { smePlugAdapter } from "./smeplug-adapter";

const ADAPTERS: Record<string, ProviderAdapter> = {
  clubkonnect: clubKonnectAdapter,
  smeplug: smePlugAdapter,
};

export interface RoutedPurchaseAttempt {
  providerId: string;
  providerName: string;
  outcome: PurchaseOutcome;
}

export interface RoutePurchaseResult {
  attempts: RoutedPurchaseAttempt[];
  finalOutcome: PurchaseOutcome;
}

/**
 * IMPORTANT: only escalates to the next provider on a "failed" outcome.
 * "pending" means the provider ACCEPTED the order and it will resolve
 * asynchronously (checked later by the retry job) — trying a second
 * provider after "pending" would risk fulfilling the same purchase
 * twice through two different providers. "success" and "pending" both
 * stop the loop immediately.
 */
export async function routePurchase(
  request: PurchaseRequest,
): Promise<RoutePurchaseResult> {
  const providerRepository = createProviderRepository(db);
  const activeProviders = await providerRepository.listActive();

  const capableProviders = activeProviders.filter((row) =>
    ADAPTERS[row.name]?.supports(request.type),
  );

  if (capableProviders.length === 0) {
    return {
      attempts: [],
      finalOutcome: {
        status: "failed",
        reason: `No active provider supports ${request.type}`,
        raw: null,
      },
    };
  }

  const attempts: RoutedPurchaseAttempt[] = [];

  for (const providerRow of capableProviders) {
    const adapter = ADAPTERS[providerRow.name];
    if (!adapter) continue; // unreachable given the filter above, guarding for TS

    const outcome = await adapter.purchase(request);
    attempts.push({
      providerId: providerRow.id,
      providerName: providerRow.name,
      outcome,
    });

    if (outcome.status === "success" || outcome.status === "pending") {
      return { attempts, finalOutcome: outcome };
    }
  }

  const lastAttempt = attempts[attempts.length - 1];
  if (!lastAttempt) {
    // Unreachable — capableProviders was non-empty, so the loop above
    // ran at least once. Satisfies TypeScript's control-flow analysis.
    throw new Error(
      "routePurchase: no attempts recorded despite capable providers existing",
    );
  }

  return { attempts, finalOutcome: lastAttempt.outcome };
}

/** Re-checks a specific provider's status for a previously-routed purchase. */
export async function checkPurchaseStatus(
  providerName: string,
  providerReference: string,
): Promise<PurchaseOutcome> {
  const adapter = ADAPTERS[providerName];
  if (!adapter) {
    throw new Error(`checkPurchaseStatus: unknown provider ${providerName}`);
  }
  return adapter.checkStatus(providerReference);
}
