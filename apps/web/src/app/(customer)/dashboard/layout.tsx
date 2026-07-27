/**
 * File: apps/web/src/app/(customer)/dashboard/layout.tsx
 * Purpose: Authoritative auth boundary for the customer area. Middleware
 *          only does an optimistic cookie check (see src/middleware.ts);
 *          this layout performs the real, database-backed session check
 *          via requireAuth() before rendering anything underneath it.
 */
import { requireAuth } from "@credixa/auth";
import { signOutAction } from "@/features/auth/actions/sign-out";
import { Button } from "@credixa/ui";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAuth();

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
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600">{session.user.name}</span>
            <form action={signOutAction}>
              <Button type="submit" variant="ghost" size="sm">
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
