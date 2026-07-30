// File: apps/admin/src/features/pricing/actions/manage-pricing-rule.ts
// Purpose: Server Actions for creating/deactivating pricing rules —
//          the Phase 6c pricing engine's admin surface (ADR 0010).

"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@credixa/auth";
import {
  db,
  createPricingRuleRepository,
  createAuditLogRepository,
} from "@credixa/db";
import type { CredixaRole } from "@credixa/types";

export type PricingActionResult =
  | { success: true }
  | { success: false; error: string };

export interface CreatePricingRuleFormInput {
  targetType: "service" | "service_type";
  serviceId?: string;
  serviceType?: "airtime" | "data" | "electricity" | "cable";
  role: CredixaRole;
  ruleType: "flat_price" | "discount_percent";
  flatPriceNaira?: number;
  discountPercent?: number;
}

export async function createPricingRuleAction(
  input: CreatePricingRuleFormInput,
): Promise<PricingActionResult> {
  const session = await requireRole("admin");

  if (input.targetType === "service" && !input.serviceId) {
    return { success: false, error: "Select a service." };
  }
  if (input.targetType === "service_type" && !input.serviceType) {
    return { success: false, error: "Select a service type." };
  }
  if (
    input.ruleType === "flat_price" &&
    (!input.flatPriceNaira || input.flatPriceNaira <= 0)
  ) {
    return { success: false, error: "Enter a valid flat price." };
  }
  if (
    input.ruleType === "discount_percent" &&
    (input.discountPercent == null ||
      input.discountPercent <= 0 ||
      input.discountPercent >= 100)
  ) {
    return {
      success: false,
      error: "Enter a discount percentage between 0 and 100.",
    };
  }

  const pricingRuleRepository = createPricingRuleRepository(db);

  try {
    const rule = await pricingRuleRepository.create({
      ...(input.targetType === "service"
        ? { serviceId: input.serviceId! }
        : {}),
      ...(input.targetType === "service_type"
        ? { serviceType: input.serviceType! }
        : {}),
      role: input.role,
      ruleType: input.ruleType,
      ...(input.ruleType === "flat_price"
        ? { flatPriceKobo: Math.round(input.flatPriceNaira! * 100) }
        : {}),
      ...(input.ruleType === "discount_percent"
        ? { discountBasisPoints: Math.round(input.discountPercent! * 100) }
        : {}),
    });

    const auditLogRepository = createAuditLogRepository(db);
    await auditLogRepository.create({
      actorUserId: session.user.id,
      action: "admin.pricing_rule.create",
      entityType: "pricing_rule",
      entityId: rule.id,
      metadata: { ...input },
    });
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error ? err.message : "Failed to create pricing rule.",
    };
  }

  revalidatePath("/dashboard/pricing");
  return { success: true };
}

export async function setPricingRuleActiveAction(
  ruleId: string,
  isActive: boolean,
): Promise<PricingActionResult> {
  const session = await requireRole("admin");

  const pricingRuleRepository = createPricingRuleRepository(db);
  const updated = await pricingRuleRepository.setActive(ruleId, isActive);
  if (!updated) {
    return { success: false, error: "Pricing rule not found." };
  }

  const auditLogRepository = createAuditLogRepository(db);
  await auditLogRepository.create({
    actorUserId: session.user.id,
    action: isActive
      ? "admin.pricing_rule.enable"
      : "admin.pricing_rule.disable",
    entityType: "pricing_rule",
    entityId: ruleId,
  });

  revalidatePath("/dashboard/pricing");
  return { success: true };
}
