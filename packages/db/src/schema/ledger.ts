// File: packages/db/src/schema/ledger.ts
// Purpose: The financial core of Credixa. Four tables:
//
//   wallet_transaction — the immutable ledger. Every credit/debit to a
//     wallet is a row here. `wallet.balance` (Phase 2) is a CACHE of the
//     sum of these rows, never written to directly outside the
//     transaction-wrapped flow in packages/db/src/ledger/wallet-ledger.ts.
//     Rows are NEVER updated or deleted — reversals are new, opposite-
//     signed rows referencing the original (see docs/wallet-ledger.md).
//
//   wallet_hold — a pending debit not yet finalized (e.g. a VTU purchase
//     in flight, once Phase 5 exists). Balance is reduced by the hold
//     amount without a ledger entry until the hold resolves.
//
//   idempotency_key — the shared primitive preventing double-processing
//     of any money-moving operation, used by wallet-ledger.ts. A row is
//     inserted BEFORE the financial effect happens; a unique-violation on
//     insert means "this exact operation was already processed," and the
//     caller is handed back the prior result instead of processing again.
//
//   audit_log — pulled forward from its originally-planned Phase 6 slot
//     (see docs/decisions/0006-audit-log-pulled-forward-to-phase-3.md)
//     because the wallet-ledger flow requires an audit entry on every
//     financial operation per docs/wallet-ledger.md's standard flow —
//     Phase 6 builds the admin UI for browsing this table, not the table
//     itself.

import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { ledgerTransactionTypeEnum, walletHoldStatusEnum } from "./enums";
import { wallet } from "./wallet";
import { user } from "./auth";

export const walletTransaction = pgTable(
  "wallet_transaction",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    walletId: uuid("wallet_id")
      .notNull()
      .references(() => wallet.id, { onDelete: "restrict" }),
    type: ledgerTransactionTypeEnum("type").notNull(),

    // Signed integer kobo: positive = credit, negative = debit.
    // Invariant: balanceAfter = balanceBefore + amount, always.
    amount: integer("amount").notNull(),
    balanceBefore: integer("balance_before").notNull(),
    balanceAfter: integer("balance_after").notNull(),

    reference: text("reference").notNull().unique(),
    idempotencyKey: text("idempotency_key").notNull().unique(),
    description: text("description"),
    metadata: jsonb("metadata"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    // Deliberately no updatedAt: this row is immutable once inserted.
  },
  (table) => [
    index("wallet_transaction_wallet_id_idx").on(table.walletId),
    index("wallet_transaction_created_at_idx").on(table.createdAt),
  ],
);

export const walletHold = pgTable(
  "wallet_hold",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    walletId: uuid("wallet_id")
      .notNull()
      .references(() => wallet.id, { onDelete: "restrict" }),

    // Always positive — the amount temporarily set aside.
    amount: integer("amount").notNull(),
    status: walletHoldStatusEnum("status").notNull().default("pending"),

    reference: text("reference").notNull().unique(),
    idempotencyKey: text("idempotency_key").notNull().unique(),
    description: text("description"),
    metadata: jsonb("metadata"),

    // Set when the hold resolves into a real ledger debit. Null while
    // pending, and stays null forever if the hold is released instead.
    finalizedTransactionId: uuid("finalized_transaction_id").references(
      () => walletTransaction.id,
      { onDelete: "restrict" },
    ),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("wallet_hold_wallet_id_idx").on(table.walletId),
    index("wallet_hold_status_idx").on(table.status),
  ],
);

export const idempotencyKey = pgTable("idempotency_key", {
  // The key itself IS the primary key — this table exists purely to make
  // "has this exact operation already happened" a single unique-insert
  // check, not a separate lookup-then-decide race window.
  key: text("key").primaryKey(),
  operation: text("operation").notNull(),
  resultType: text("result_type").notNull(), // "wallet_transaction" | "wallet_hold"
  resultId: uuid("result_id").notNull(),

  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const auditLog = pgTable(
  "audit_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // Null for system/background-initiated actions (e.g. a reconciliation
    // job flagging drift) — not every audited event has a human actor.
    actorUserId: text("actor_user_id").references(() => user.id, {
      onDelete: "restrict",
    }),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),
    metadata: jsonb("metadata"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("audit_log_entity_idx").on(table.entityType, table.entityId),
    index("audit_log_actor_idx").on(table.actorUserId),
    index("audit_log_created_at_idx").on(table.createdAt),
  ],
);
