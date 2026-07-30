// File: packages/db/src/pricing/resolve-price.ts
// Purpose: The single place that decides what a customer actually pays
//          for a VTU purchase. Called by the apps/web purchase actions
//          before initiatePurchase — the resolved amount is what gets
//          passed through as InitiatePurchaseInput.amountKobo, so the
//          ledger and holds never need to know pricing rules exist at
//          all.
//
// Resolution order (most specific wins):
//   1. An active rule for this EXACT service + the caller's role.
//   2. An active blanket rule for this service's TYPE + the caller's
//      role (serviceId null on the rule).
//   3. The base price: service.priceKobo (fixed plans) or
//      requestedAmountKobo (variable amounts — airtime/electricity).

import type { Database } from "../client";
import type { CredixaRole } from "@credixa/types";
import { createServiceRepository } from "../repositories/service-repository";
import { createPricingRuleRepository } from "../repositories/pricing-rule-repository";
import type { PricingRuleRecord } from "../repositories/pricing-rule-repository";

export interface ResolvePriceParams {
  serviceId: string;
  role: CredixaRole;
  /** Required for services with no fixed `priceKobo` (airtime,
   * electricity) — the amount the user entered, before any discount. */
  requestedAmountKobo?: number;
}

export interface ResolvedPrice {
  amountKobo: number;
  source: "flat_price_rule" | "discount_rule" | "base_price";
  ruleId: string | null;
}

export async function resolvePrice(
  db: Database,
  params: ResolvePriceParams,
): Promise<ResolvedPrice> {
  const serviceRepository = createServiceRepository(db);
  const serviceRow = await serviceRepository.findById(params.serviceId);
  if (!serviceRow) {
    throw new Error(`resolvePrice: service ${params.serviceId} not found`);
  }

  const baseAmountKobo = serviceRow.priceKobo ?? params.requestedAmountKobo;
  if (baseAmountKobo == null) {
    throw new Error(
      `resolvePrice: service ${params.serviceId} has no fixed price and no requestedAmountKobo was provided`,
    );
  }

  const pricingRuleRepository = createPricingRuleRepository(db);

  const specificRule = await pricingRuleRepository.findActiveByServiceAndRole(
    params.serviceId,
    params.role,
  );
  const rule: PricingRuleRecord | null =
    specificRule ??
    (await pricingRuleRepository.findActiveByServiceTypeAndRole(
      serviceRow.type,
      params.role,
    ));

  if (!rule) {
    return { amountKobo: baseAmountKobo, source: "base_price", ruleId: null };
  }

  if (rule.ruleType === "flat_price" && rule.flatPriceKobo != null) {
    return {
      amountKobo: rule.flatPriceKobo,
      source: "flat_price_rule",
      ruleId: rule.id,
    };
  }

  if (
    rule.ruleType === "discount_percent" &&
    rule.discountBasisPoints != null
  ) {
    const discounted = Math.round(
      (baseAmountKobo * (10_000 - rule.discountBasisPoints)) / 10_000,
    );
    return { amountKobo: discounted, source: "discount_rule", ruleId: rule.id };
  }

  // Rule exists but is missing the field its own ruleType requires
  // (shouldn't happen given the repository's create-time validation,
  // but never silently apply a broken rule — fall back to base price).
  return { amountKobo: baseAmountKobo, source: "base_price", ruleId: null };
}
