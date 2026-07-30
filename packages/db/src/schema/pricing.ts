// File: packages/db/src/schema/pricing.ts
// Purpose: The pricing engine deferred by ADR 0010 (Phase 5 shipped flat
//          pricing only). A `pricing_rule` row overrides the base price
//          from `service.priceKobo` (or, for airtime/electricity which
//          have no fixed price, discounts the user's entered amount) for
//          a specific role. Resolution logic lives in
//          packages/db/src/pricing/resolve-price.ts, not here — this
//          file is schema only.
//
// Scope note: rules key on `role` (customer | agent | admin), not on a
// specific agent or agent tier — Phase 7 (Agent Platform) is what
// introduces per-agent-tier granularity, and doesn't exist yet. A rule
// with role="agent" today applies to every agent uniformly. Phase 7
// extending this to per-tier or per-agent overrides is expected to add
// columns here, not replace this table.

import {
  boolean,
  index,
  integer,
  pgTable,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { pricingRuleTypeEnum, roleEnum, vtuServiceTypeEnum } from "./enums";
import { service } from "./vtu";

export const pricingRule = pgTable(
  "pricing_rule",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // A rule targets EITHER one specific service (serviceId set) OR
    // every service of a type (serviceType set, serviceId null) — an
    // application-level XOR, not a DB constraint (see
    // pricing-rule-repository.ts for how this is validated on write).
    // A specific-service rule takes priority over a service-type rule
    // when both could apply — see resolve-price.ts.
    serviceId: uuid("service_id").references(() => service.id, {
      onDelete: "cascade",
    }),
    serviceType: vtuServiceTypeEnum("service_type"),

    role: roleEnum("role").notNull(),
    ruleType: pricingRuleTypeEnum("rule_type").notNull(),

    // Used when ruleType = "flat_price". Overrides service.priceKobo
    // outright.
    flatPriceKobo: integer("flat_price_kobo"),
    // Used when ruleType = "discount_percent". Stored as basis points
    // (100 = 1%) to avoid floating-point percentages entirely — this
    // project's kobo-integer convention extended to percentages too.
    discountBasisPoints: integer("discount_basis_points"),

    isActive: boolean("is_active").notNull().default(true),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("pricing_rule_service_id_idx").on(table.serviceId),
    index("pricing_rule_service_type_role_idx").on(
      table.serviceType,
      table.role,
    ),
  ],
);
