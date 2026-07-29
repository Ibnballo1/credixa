/**
 * File: apps/admin/src/app/(admin)/dashboard/layout.tsx
 * Purpose: Authoritative auth+role boundary for the entire admin area.
 *          proxy.ts only does an optimistic cookie check; this layout
 *          performs the real, database-backed session check AND enforces
 *          that only role === "admin" may proceed — the same guard used
 *          by the sign-in action, applied again here because a session
 *          could theoretically be modified after sign-in (e.g. a role
 *          change while a session is still active), so every protected
 *          admin request re-checks the role rather than trusting the
 *          sign-in-time check alone.
 */
import Link from "next/link";
import { requireRole } from "@credixa/auth";
import { signOutAction } from "@/features/auth/actions/sign-out";
import { Button } from "@credixa/ui";

const NAV_LINKS = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Users", href: "/dashboard/users" },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireRole("admin");

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-primary" />
            <span className="text-lg font-semibold text-slate-900">
              Credixa Admin
            </span>
          </div>
          <nav className="flex items-center gap-4">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-slate-600 hover:text-slate-900"
              >
                {link.label}
              </Link>
            ))}
            <span className="text-sm text-slate-600">{session.user.name}</span>
            <form action={signOutAction}>
              <Button type="submit" variant="ghost" size="sm">
                Sign out
              </Button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
