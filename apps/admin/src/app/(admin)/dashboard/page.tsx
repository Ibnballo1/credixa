/**
 * File: apps/admin/src/app/(admin)/dashboard/page.tsx
 * Purpose: Placeholder admin dashboard for Phase 1. Real analytics, user
 *          management, wallet management, etc. are built in Phase 6 —
 *          this page exists to prove the admin-only auth chain works.
 */
import { requireRole } from "@credixa/auth";

export default async function AdminDashboardPage() {
  const session = await requireRole("admin");

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">
        Welcome, {session.user.name.split(" ")[0]}
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Signed in with admin access.
      </p>

      <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
        <p className="text-sm text-slate-500">
          Analytics, user management, and transaction monitoring land in Phase
          6.
        </p>
      </div>
    </div>
  );
}
