// File: packages/db/src/schema/payment.ts
// Purpose: Wallet funding via a payment provider (Paystack today). Two
//          tables:
//
//   payment — one row per funding attempt, user-facing. NOT the ledger —
//     `wallet_transaction` (Phase 3) is still the source of truth for the
//     wallet's balance. This table exists to track a payment's lifecycle
//     (initiated → success/failed/abandoned) and link to the
//     wallet_transaction it eventually produces. See
//     docs/decisions/0008-payment-table-not-generic-transactions.md for
//     why this is a domain-specific table rather than the originally
//     planned generic `transactions` table.
//
//   payment_webhook — every inbound webhook payload, logged BEFORE
//     signature verification is even checked (so a spoofed/failed webhook
//     is still visible for security review), with `signatureValid` and
//     `processedAt`/`processingError` tracking what happened to it.

import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  index,
} from "drizzle-orm/pg-core";
import { paymentProviderEnum, paymentStatusEnum } from "./enums";
import { user } from "./auth";
import { wallet } from "./wallet";
import { walletTransaction } from "./ledger";

export const payment = pgTable(
  "payment",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    walletId: uuid("wallet_id")
      .notNull()
      .references(() => wallet.id, { onDelete: "restrict" }),

    provider: paymentProviderEnum("provider").notNull().default("paystack"),
    status: paymentStatusEnum("status").notNull().default("initiated"),

    // Our own reference, sent to Paystack as `reference` on initialize —
    // Paystack's verify/webhook responses echo it back unchanged, so this
    // one column is what ties all three code paths (callback, webhook,
    // sweep) to the same payment row.
    reference: text("reference").notNull().unique(),
    // Paystack's own internal transaction id (data.id) — not used for
    // lookups (reference is), kept for cross-referencing the Paystack
    // dashboard during support/reconciliation.
    providerTransactionId: text("provider_transaction_id"),

    amountKobo: integer("amount_kobo").notNull(),
    currency: text("currency").notNull().default("NGN"),
    channel: text("channel"), // "card" | "bank" | "ussd" | ... from Paystack

    // Set once the funding credit lands in the ledger — never set
    // directly, only as a result of packages/lib's
    // verifyAndCreditPayment succeeding.
    walletTransactionId: uuid("wallet_transaction_id").references(
      () => walletTransaction.id,
      { onDelete: "restrict" },
    ),

    paidAt: timestamp("paid_at", { withTimezone: true }),
    // Raw snapshot of the last Paystack response we received for this
    // payment (verify or webhook) — for debugging/support, not relied on
    // for any business logic.
    metadata: jsonb("metadata"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("payment_user_id_idx").on(table.userId),
    index("payment_status_idx").on(table.status),
    index("payment_created_at_idx").on(table.createdAt),
  ],
);

export const paymentWebhook = pgTable(
  "payment_webhook",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    provider: text("provider").notNull(),
    eventType: text("event_type").notNull(),
    reference: text("reference"),

    // Logged regardless of signature validity — a failed-signature row
    // is itself a security-relevant record (an attempted spoof), not
    // something to discard.
    rawPayload: jsonb("raw_payload").notNull(),
    signatureValid: boolean("signature_valid").notNull(),

    processedAt: timestamp("processed_at", { withTimezone: true }),
    processingError: text("processing_error"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("payment_webhook_reference_idx").on(table.reference),
    index("payment_webhook_created_at_idx").on(table.createdAt),
  ],
);
