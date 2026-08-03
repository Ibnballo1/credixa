// File: packages/db/src/schema/enums.ts
// Purpose: Postgres enums used across the schema. Defined once here so a
//          value can never drift between tables that reference the same
//          concept.

import { pgEnum } from "drizzle-orm/pg-core";
import { CREDIXA_ROLES } from "@credixa/types";

// Mirrors @credixa/types CREDIXA_ROLES exactly — imported, not re-typed,
// so the DB enum and the application-level type can never fall out of sync.
export const roleEnum = pgEnum("credixa_role", CREDIXA_ROLES);

export const kycStatusEnum = pgEnum("credixa_kyc_status", [
  "unverified",
  "pending",
  "verified",
  "rejected",
]);

// Phase 2: wallet is a real (currently balance-always-zero) table — see
// docs/database-schema.md for why this differs from the transactions
// table, which stays UI-only until Phase 4/5.
export const walletStatusEnum = pgEnum("credixa_wallet_status", [
  "active",
  "frozen",
]);

export const notificationTypeEnum = pgEnum("credixa_notification_type", [
  "system",
  "transaction",
  "security",
  "promotion",
]);

// Phase 3: what kind of ledger event produced a wallet_transaction row.
// `adjustment` covers both manual admin corrections (Phase 6) and the
// temporary dev/QA credit path used to exercise the ledger before Phase
// 4 (funding) and Phase 5 (purchases) provide real callers.
export const ledgerTransactionTypeEnum = pgEnum(
  "credixa_ledger_transaction_type",
  ["funding", "purchase", "refund", "reversal", "commission", "adjustment"],
);

export const walletHoldStatusEnum = pgEnum("credixa_wallet_hold_status", [
  "pending",
  "finalized",
  "released",
]);

// Phase 4: payment provider abstraction. Only "paystack" today, but kept
// as an enum (not a bare string) so adding a second provider later is a
// one-line change here rather than a data-migration.
export const paymentProviderEnum = pgEnum("credixa_payment_provider", [
  "paystack",
]);

export const paymentStatusEnum = pgEnum("credixa_payment_status", [
  "initiated",
  "success",
  "failed",
  "abandoned",
]);

// Phase 5: VTU services
export const vtuServiceTypeEnum = pgEnum("credixa_vtu_service_type", [
  "airtime",
  "data",
  "electricity",
  "cable",
]);

export const vtuPurchaseStatusEnum = pgEnum("credixa_vtu_purchase_status", [
  "pending",
  "success",
  "failed",
]);

// Phase 6c: pricing engine (ADR 0010). "flat_price" overrides
// service.priceKobo outright (data/cable-style fixed plans);
// "discount_percent" applies a percentage off a variable, user-entered
// amount (airtime/electricity-style) — see
// packages/db/src/pricing/resolve-price.ts.
export const pricingRuleTypeEnum = pgEnum("credixa_pricing_rule_type", [
  "flat_price",
  "discount_percent",
]);

// Phase 7a: agent registration approval workflow. A user's role only
// becomes "agent" (via Better Auth's admin plugin, same mechanism as
// Phase 6a's role management) once an admin approves their application
// — applying alone does not grant agent pricing.
export const agentStatusEnum = pgEnum("credixa_agent_status", [
  "pending",
  "approved",
  "rejected",
  "suspended",
]);

// Phase 7b: referrals. "qualified" means the referred user completed a
// qualifying action (their first successful wallet funding) — signing up
// alone does not qualify a referral, to avoid rewarding referrals for
// accounts that never actually transact. See
// packages/lib/src/payments/verify-and-credit-payment.ts for where
// qualification is detected.
export const referralStatusEnum = pgEnum("credixa_referral_status", [
  "pending",
  "qualified",
]);

// Phase 7c: commission engine. Two distinct triggers:
//   "referral" — a flat one-time bonus when a referral qualifies (7b).
//   "agent_margin" — a percentage cashback on an agent's OWN successful
//     VTU purchases, on top of their already-discounted pricing_rule
//     price. See docs/decisions/0015-commission-engine-design.md for
//     why these are the two types and why rates are constants for now.
export const commissionTypeEnum = pgEnum("credixa_commission_type", [
  "referral",
  "agent_margin",
]);

export const commissionStatusEnum = pgEnum("credixa_commission_status", [
  "pending",
  "paid",
  "failed",
]);
