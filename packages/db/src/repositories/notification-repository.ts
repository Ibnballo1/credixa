// File: packages/db/src/repositories/notification-repository.ts
// Purpose: Data-access layer for the `notification` table.

import { and, count, desc, eq, isNull } from "drizzle-orm";
import type { Database } from "../client";
import { notification } from "../schema";

export type NotificationRecord = typeof notification.$inferSelect;

export function createNotificationRepository(db: Database) {
  return {
    async listRecentByUser(
      userId: string,
      limit = 10,
    ): Promise<NotificationRecord[]> {
      return db
        .select()
        .from(notification)
        .where(eq(notification.userId, userId))
        .orderBy(desc(notification.createdAt))
        .limit(limit);
    },

    async countUnreadByUser(userId: string): Promise<number> {
      const [row] = await db
        .select({ value: count() })
        .from(notification)
        .where(
          and(eq(notification.userId, userId), isNull(notification.readAt)),
        );
      return row?.value ?? 0;
    },
  };
}

export type NotificationRepository = ReturnType<
  typeof createNotificationRepository
>;
