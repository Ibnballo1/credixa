// File: packages/db/src/schema/agent.ts
// Purpose: Agent registration/approval. Deliberately does NOT include a
//          separate "agent wallet" — agents use the same `wallet` table
//          as every other user (one wallet per userId, role-agnostic);
//          discounted agent pricing already works via `pricing_rule`
//          rows keyed on `role: "agent"` (Phase 6c). This table exists
//          purely for the application/approval workflow and agent-
//          specific profile fields.
//
// Referral codes are deliberately NOT on this table — Phase 7b (Referral
// System) decides where that belongs, since referrals may end up being
// broader than an agent-only concept.

import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { agentStatusEnum } from "./enums";
import { user } from "./auth";

export const agent = pgTable(
  "agent",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .unique()
      .references(() => user.id, { onDelete: "restrict" }),

    businessName: text("business_name").notNull(),
    status: agentStatusEnum("status").notNull().default("pending"),

    // Forward-looking column for Phase 7's own future extension (per
    // ADR 0012's note on adding agent-tier granularity to pricing_rule
    // resolution) — not wired into any pricing logic yet. Every agent
    // is "standard" today; role-level pricing_rule rows are what
    // actually apply the agent discount in Phase 6c/7a.
    tier: text("tier").notNull().default("standard"),

    approvedAt: timestamp("approved_at", { withTimezone: true }),
    approvedBy: text("approved_by").references(() => user.id, {
      onDelete: "restrict",
    }),
    rejectionReason: text("rejection_reason"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("agent_status_idx").on(table.status)],
);
