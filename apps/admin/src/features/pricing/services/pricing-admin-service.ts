// File: apps/admin/src/features/pricing/services/pricing-admin-service.ts
// Purpose: Read-side queries for the admin pricing rules area.

import {
  db,
  createPricingRuleRepository,
  createServiceRepository,
} from "@credixa/db";
import type { PricingRuleRecord, ServiceRecord } from "@credixa/db";

export interface PricingRuleWithLabel extends PricingRuleRecord {
  targetLabel: string;
}

export async function listPricingRules(): Promise<PricingRuleWithLabel[]> {
  const pricingRuleRepository = createPricingRuleRepository(db);
  const serviceRepository = createServiceRepository(db);
  const rules = await pricingRuleRepository.listAll();

  const withLabels: PricingRuleWithLabel[] = [];
  for (const rule of rules) {
    let targetLabel: string;
    if (rule.serviceId) {
      const serviceRow = await serviceRepository.findById(rule.serviceId);
      targetLabel = serviceRow ? serviceRow.name : "Unknown service";
    } else {
      targetLabel = `All ${rule.serviceType} services`;
    }
    withLabels.push({ ...rule, targetLabel });
  }

  return withLabels;
}

export async function listServicesForPricingForm(): Promise<ServiceRecord[]> {
  return createServiceRepository(db).listAll();
}
