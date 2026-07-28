// File: packages/db/src/ledger/generate-reference.ts
// Purpose: Human-readable, unique reference strings for ledger records
//          (wallet_transaction.reference, wallet_hold.reference). Uses
//          Node's built-in crypto — no new dependency for something this
//          simple. Lives here (not packages/lib) specifically to avoid a
//          circular dependency: packages/lib's Inngest reconciliation job
//          needs @credixa/db, so @credixa/db cannot depend back on
//          @credixa/lib for this.

import { randomUUID } from "node:crypto";

/**
 * Generates a reference like "TXN-9F3A2C1B4D5E6A7B".
 * Not a secret, not an idempotency key — purely a human/support-facing
 * identifier. Uniqueness is enforced by the database column's UNIQUE
 * constraint, not by this function alone.
 */
export function generateReference(prefix: string): string {
  const suffix = randomUUID().replace(/-/g, "").slice(0, 16).toUpperCase();
  return `${prefix}-${suffix}`;
}
