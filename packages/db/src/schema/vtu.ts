// File: packages/db/src/schema/vtu.ts
// Purpose: The VTU domain. Four tables:
//
//   provider — the registry of VTU providers (ClubKonnect, SMEPlug) and
//     which service types each one supports. `isActive` is the kill
//     switch for a provider whose integration turns out broken (see the
//     electricity/cable verification caveat in
//     packages/lib/src/providers/clubkonnect-adapter.ts).
//
//   service — the purchasable catalog. For airtime/electricity, one row
//     per network/disco with `priceKobo: null` (the customer types an
//     arbitrary amount). For data/cable, one row per plan/package with a
//     fixed `priceKobo`.
//
//   vtu_purchase — mirrors `payment`'s role (ADR 0008) for this domain:
//     one row per purchase attempt, referencing the `wallet_hold` it
//     reserved funds against and the `wallet_transaction` it produces on
//     success (via ProviderRouter + the hold finalize/release flow — see
//     packages/lib/src/vtu/purchase-service.ts).
//
//   provider_transaction — one row per ACTUAL API call attempt to a
//     provider. A single vtu_purchase can have multiple rows here if
//     the router retries or fails over to a second provider.

import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { vtuServiceTypeEnum, vtuPurchaseStatusEnum } from "./enums";
import { user } from "./auth";
import { wallet } from "./wallet";
import { walletHold } from "./ledger";
import { walletTransaction } from "./ledger";

export const provider = pgTable("provider", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(), // "clubkonnect" | "smeplug"
  displayName: text("display_name").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  // Lower number = tried first. A blunt instrument compared to the
  // cost-based routing described in docs/vtu-provider-adapter.md — full
  // cost-based selection is Phase 6 "Service Configuration" scope, once
  // an admin UI exists to manage it. This column is what ProviderRouter
  // uses in the meantime, and is what that future engine will read/write
  // instead of requiring a schema change.
  priority: integer("priority").notNull().default(100),

  supportsAirtime: boolean("supports_airtime").notNull().default(false),
  supportsData: boolean("supports_data").notNull().default(false),
  supportsElectricity: boolean("supports_electricity").notNull().default(false),
  supportsCable: boolean("supports_cable").notNull().default(false),

  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const service = pgTable(
  "service",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    type: vtuServiceTypeEnum("type").notNull(),
    // Network code (MTN/AIRTEL/GLO/9MOBILE) for airtime/data, disco code
    // (EKEDC/IKEDC/...) for electricity, cable provider (DSTV/GOTV/
    // STARTIMES) for cable.
    network: text("network").notNull(),
    name: text("name").notNull(),
    // The code a provider's API expects for this specific plan
    // (data/cable only) — null for airtime/electricity, which have no
    // fixed "plan," just an arbitrary amount.
    providerPlanCode: text("provider_plan_code"),
    // Null for airtime/electricity (variable, user-entered amount).
    // Fixed for data/cable plans.
    priceKobo: integer("price_kobo"),
    isActive: boolean("is_active").notNull().default(true),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("service_type_network_idx").on(table.type, table.network)],
);

export const vtuPurchase = pgTable(
  "vtu_purchase",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    walletId: uuid("wallet_id")
      .notNull()
      .references(() => wallet.id, { onDelete: "restrict" }),
    serviceId: uuid("service_id")
      .notNull()
      .references(() => service.id, { onDelete: "restrict" }),
    providerId: uuid("provider_id").references(() => provider.id, {
      onDelete: "restrict",
    }),

    status: vtuPurchaseStatusEnum("status").notNull().default("pending"),

    recipientPhone: text("recipient_phone"),
    recipientMeterNumber: text("recipient_meter_number"),
    recipientSmartCardNumber: text("recipient_smart_card_number"),

    amountKobo: integer("amount_kobo").notNull(),
    reference: text("reference").notNull().unique(),
    providerReference: text("provider_reference"),

    walletHoldId: uuid("wallet_hold_id")
      .notNull()
      .references(() => walletHold.id, { onDelete: "restrict" }),
    walletTransactionId: uuid("wallet_transaction_id").references(
      () => walletTransaction.id,
      { onDelete: "restrict" },
    ),

    attemptCount: integer("attempt_count").notNull().default(0),
    lastError: text("last_error"),
    metadata: jsonb("metadata"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("vtu_purchase_user_id_idx").on(table.userId),
    index("vtu_purchase_status_idx").on(table.status),
    index("vtu_purchase_created_at_idx").on(table.createdAt),
  ],
);

export const providerTransaction = pgTable(
  "provider_transaction",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    vtuPurchaseId: uuid("vtu_purchase_id")
      .notNull()
      .references(() => vtuPurchase.id, { onDelete: "restrict" }),
    providerId: uuid("provider_id")
      .notNull()
      .references(() => provider.id, { onDelete: "restrict" }),

    // Request payload with credentials redacted before storage — see
    // packages/lib/src/providers/types.ts's redactRequestForLogging.
    requestPayload: jsonb("request_payload").notNull(),
    responsePayload: jsonb("response_payload"),
    success: boolean("success").notNull(),
    errorMessage: text("error_message"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("provider_transaction_vtu_purchase_id_idx").on(table.vtuPurchaseId),
  ],
);
