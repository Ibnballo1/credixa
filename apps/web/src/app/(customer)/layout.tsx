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
import { Button } from "@credixa/ui";

export default async function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAuth();
  const notificationSummary = await getNotificationSummary(session.user.id);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-primary" />
            <span className="text-lg font-semibold text-slate-900">
              Credixa
            </span>
          </div>
          <nav className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              Dashboard
            </Link>
            <Link
              href="/profile"
              className="text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              Profile
            </Link>
            <NotificationBell summary={notificationSummary} />
            <span className="text-sm text-slate-600">{session.user.name}</span>
            <form action={signOutAction}>
              <Button type="submit" variant="ghost" size="sm">
                Sign out
              </Button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
