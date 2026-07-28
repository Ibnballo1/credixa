// File: packages/db/src/schema/notification.ts
// Purpose: In-app notification records. Nothing writes to this table yet
//          (no event producers exist until later phases generate real
//          notifications), so it's genuinely empty — the dashboard's
//          notification bell renders a real empty state, not mock data.
//
// Unlike `wallet`, this is NOT financial data — it's safe to
// cascade-delete a user's notifications if the user is ever deleted,
// unlike wallet/transaction records which must never disappear.

import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { notificationTypeEnum } from "./enums";
import { user } from "./auth";

export const notification = pgTable(
  "notification",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    type: notificationTypeEnum("type").notNull().default("system"),
    title: text("title").notNull(),
    body: text("body").notNull(),
    readAt: timestamp("read_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("notification_user_id_idx").on(table.userId),
    index("notification_user_id_read_at_idx").on(table.userId, table.readAt),
  ],
);
