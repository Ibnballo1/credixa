// File: packages/db/src/repositories/pricing-rule-repository.ts
// Purpose: Data-access layer for `pricing_rule`. Enforces the
//          serviceId/serviceType XOR on write (the schema itself can't
//          express this as a DB constraint without raw SQL, which felt
//          like more ceremony than this admin-authored, low-write-volume
//          table warranted — validated here instead).

import { and, eq, isNull } from "drizzle-orm";
import type { Database } from "../client";
import { pricingRule } from "../schema";
import type { CredixaRole } from "@credixa/types";

export type PricingRuleRecord = typeof pricingRule.$inferSelect;

export interface CreatePricingRuleInput {
  serviceId?: string;
  serviceType?: PricingRuleRecord["serviceType"];
  role: CredixaRole;
  ruleType: PricingRuleRecord["ruleType"];
  flatPriceKobo?: number;
  discountBasisPoints?: number;
}

export function createPricingRuleRepository(db: Database) {
  return {
    async create(input: CreatePricingRuleInput): Promise<PricingRuleRecord> {
      const hasService = input.serviceId != null;
      const hasType = input.serviceType != null;
      if (hasService === hasType) {
        throw new Error(
          "createPricingRuleRepository.create: exactly one of serviceId or serviceType must be set",
        );
      }
      if (input.ruleType === "flat_price" && input.flatPriceKobo == null) {
        throw new Error(
          "create: flatPriceKobo is required for a flat_price rule",
        );
      }
      if (
        input.ruleType === "discount_percent" &&
        input.discountBasisPoints == null
      ) {
        throw new Error(
          "create: discountBasisPoints is required for a discount_percent rule",
        );
      }

      const [row] = await db.insert(pricingRule).values(input).returning();
      if (!row) {
        throw new Error(
          "createPricingRuleRepository.create: insert returned no row",
        );
      }
      return row;
    },

    async listAll(): Promise<PricingRuleRecord[]> {
      return db.select().from(pricingRule);
    },

    /** Most specific active rule for one exact service + role. */
    async findActiveByServiceAndRole(
      serviceId: string,
      role: CredixaRole,
    ): Promise<PricingRuleRecord | null> {
      const [row] = await db
        .select()
        .from(pricingRule)
        .where(
          and(
            eq(pricingRule.serviceId, serviceId),
            eq(pricingRule.role, role),
            eq(pricingRule.isActive, true),
          ),
        )
        .limit(1);
      return row ?? null;
    },

    /** Blanket active rule for every service of a type + role. */
    async findActiveByServiceTypeAndRole(
      serviceType: PricingRuleRecord["serviceType"],
      role: CredixaRole,
    ): Promise<PricingRuleRecord | null> {
      if (!serviceType) return null;
      const [row] = await db
        .select()
        .from(pricingRule)
        .where(
          and(
            eq(pricingRule.serviceType, serviceType),
            isNull(pricingRule.serviceId),
            eq(pricingRule.role, role),
            eq(pricingRule.isActive, true),
          ),
        )
        .limit(1);
      return row ?? null;
    },

    async setActive(
      id: string,
      isActive: boolean,
    ): Promise<PricingRuleRecord | null> {
      const [row] = await db
        .update(pricingRule)
        .set({ isActive, updatedAt: new Date() })
        .where(eq(pricingRule.id, id))
        .returning();
      return row ?? null;
    },
  };
}

export type PricingRuleRepository = ReturnType<
  typeof createPricingRuleRepository
>;
