/**
 * File: apps/web/src/app/(customer)/layout.tsx
 * Purpose: Authoritative auth boundary + shared shell for EVERY
 *          authenticated customer route (/dashboard, /profile, and any
 *          future customer route). proxy.ts only does an optimistic
 *          cookie check; this layout performs the real, database-backed
 *          session check via requireAuth() before rendering anything
 *          underneath it.
 */
import Link from "next/link";
import { requireAuth } from "@credixa/auth";
import { signOutAction } from "@/features/auth/actions/sign-out";
import { getNotificationSummary } from "@/features/notifications/services/notification-service";
import { NotificationBell } from "@/features/notifications/components/notification-bell";
import { Button, Logo } from "@credixa/ui";
import { Header } from "@/components/layout/header";

export default async function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAuth();
  const notificationSummary = await getNotificationSummary(session.user.id);

  return (
    <div className="min-h-screen bg-slate-50">
      <Header session={session} notificationSummary={notificationSummary} />
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
