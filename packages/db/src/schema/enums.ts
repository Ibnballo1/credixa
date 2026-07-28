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
