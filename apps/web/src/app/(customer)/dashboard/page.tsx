/**
 * File: apps/web/src/app/(customer)/dashboard/page.tsx
 * Purpose: Placeholder dashboard content for Phase 1. Real wallet balance,
 *          quick actions, and transaction history are built in Phase 2/3 —
 *          this page exists to prove the full sign-up → session →
 *          protected-route chain works end to end.
 */
import { requireAuth } from "@credixa/auth";

export default async function DashboardPage() {
  const session = await requireAuth();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">
        Welcome, {session.user.name.split(" ")[0]}
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Role:{" "}
        <span className="font-medium text-slate-700">{session.user.role}</span>
      </p>

      <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
        <p className="text-sm text-slate-500">
          Wallet balance, quick actions, and transaction history land in Phase
          2.
        </p>
      </div>
    </div>
  );
}
