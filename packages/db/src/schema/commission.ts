// File: packages/db/src/schema/commission.ts
// Purpose: The commission engine (Phase 7c). One row per commission
//          event, polymorphic over its trigger via (sourceType,
//          sourceId) — a `referral` row or a `vtu_purchase` row. The
//          unique index on (sourceType, sourceId) is what makes
//          commission-awarding idempotent at the database level: the
//          same referral or purchase can never generate two commission
//          rows, no matter how many times the awarding hook fires.

import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { commissionTypeEnum, commissionStatusEnum } from "./enums";
import { user } from "./auth";
import { walletTransaction } from "./ledger";

export const commission = pgTable(
  "commission",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    type: commissionTypeEnum("type").notNull(),

    // Polymorphic source — "referral" + referral.id, or "vtu_purchase" +
    // vtu_purchase.id. No FK constraint (deliberately — a single FK
    // can't target two different tables), the uniqueness guarantee is
    // what matters here, not referential integrity to a specific table.
    sourceType: text("source_type").notNull(),
    sourceId: uuid("source_id").notNull(),

    amountKobo: integer("amount_kobo").notNull(),
    status: commissionStatusEnum("status").notNull().default("pending"),

    walletTransactionId: uuid("wallet_transaction_id").references(
      () => walletTransaction.id,
      { onDelete: "restrict" },
    ),
    errorMessage: text("error_message"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("commission_source_unique_idx").on(
      table.sourceType,
      table.sourceId,
    ),
    index("commission_user_id_idx").on(table.userId),
    index("commission_status_idx").on(table.status),
  ],
);
