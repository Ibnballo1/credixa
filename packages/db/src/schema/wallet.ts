// File: packages/db/src/schema/wallet.ts
// Purpose: Minimal wallet table for Phase 2. One row per user, created
//          lazily on first dashboard visit (see
//          apps/web/src/features/wallet/services/wallet-service.ts).
//
// IMPORTANT: `balance` has no write path anywhere in the codebase yet —
// no funding (Phase 4) or purchase (Phase 5) logic exists, so this column
// is always 0. It does NOT yet honor the "balance is derived from the
// ledger" invariant from docs/wallet-ledger.md, because there is no
// ledger yet. Phase 3 adds `wallet_transactions` and converts every write
// to this column into a ledger-transaction-wrapped operation. Until then,
// this table must never be written to outside `wallet-service.ts`'s
// get-or-create path.

import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { walletStatusEnum } from "./enums";
import { user } from "./auth";

export const wallet = pgTable("wallet", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "restrict" }),

  // Stored in kobo (1 Naira = 100 kobo) as an integer — never a float.
  // See packages/lib/src/currency/format-naira.ts for display formatting.
  balance: integer("balance").notNull().default(0),
  currency: text("currency").notNull().default("NGN"),
  status: walletStatusEnum("status").notNull().default("active"),

  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
