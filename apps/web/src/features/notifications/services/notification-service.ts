// File: apps/web/src/features/notifications/services/notification-service.ts
// Purpose: Application-service layer for notification reads.

import { db, createNotificationRepository } from "@credixa/db";
import type { NotificationRecord } from "@credixa/db";

const notificationRepository = createNotificationRepository(db);

export interface NotificationSummary {
  recent: NotificationRecord[];
  unreadCount: number;
}

export async function getNotificationSummary(
  userId: string,
): Promise<NotificationSummary> {
  const [recent, unreadCount] = await Promise.all([
    notificationRepository.listRecentByUser(userId, 5),
    notificationRepository.countUnreadByUser(userId),
  ]);

  return { recent, unreadCount };
}
