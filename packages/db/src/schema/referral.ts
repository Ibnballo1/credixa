// File: packages/db/src/schema/referral.ts
// Purpose: The referral system (Phase 7b). Two tables, deliberately
//          separate from `user` (no additionalFields extension) and from
//          `agent` (per ADR 0013's note that referrals aren't an
//          agent-only concept — every user gets a referral code,
//          regardless of role):
//
//   referral_code — one code per user, lazily generated on first need
//     (same pattern as `wallet`'s getOrCreateWallet — see
//     packages/db/src/repositories/referral-code-repository.ts).
//
//   referral — one row per successful referral relationship. A user can
//     be REFERRED at most once (unique referredUserId) but can REFER
//     many people. `status` starts "pending" at signup and becomes
//     "qualified" only once the referred user completes a qualifying
//     action, not merely by signing up — see the enum's comment in
//     enums.ts. Phase 7c (Commission Engine) reads "qualified" referrals
//     to compute commissions; this phase only tracks and qualifies them.

import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { referralStatusEnum } from "./enums";
import { user } from "./auth";

export const referralCode = pgTable("referral_code", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "restrict" }),
  code: text("code").notNull().unique(),

  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const referral = pgTable(
  "referral",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    referrerUserId: text("referrer_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    referredUserId: text("referred_user_id")
      .notNull()
      .unique()
      .references(() => user.id, { onDelete: "restrict" }),
    // Snapshot of the code used at signup — kept even if the referrer's
    // code is regenerated later (it never is today, but this avoids the
    // question entirely).
    referralCode: text("referral_code").notNull(),

    status: referralStatusEnum("status").notNull().default("pending"),
    qualifiedAt: timestamp("qualified_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("referral_referrer_user_id_idx").on(table.referrerUserId),
    index("referral_status_idx").on(table.status),
  ],
);
