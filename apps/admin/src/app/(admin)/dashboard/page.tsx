/**
 * File: apps/admin/src/app/(admin)/dashboard/page.tsx
 * Purpose: Admin dashboard overview — platform-wide analytics (Phase 6c).
 */
import Link from "next/link";
import { requireRole } from "@credixa/auth";
import { db, getPlatformStats } from "@credixa/db";
import { formatKoboAsNaira } from "@credixa/lib";

export default async function AdminDashboardPage() {
  const session = await requireRole("admin");
  const stats = await getPlatformStats(db);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">
        Welcome, {session.user.name.split(" ")[0]}
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Platform overview, last 30 days.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total users"
          value={stats.totalUsers.toLocaleString("en-NG")}
        />
        <StatCard
          label="Total wallet balance"
          value={formatKoboAsNaira(stats.totalWalletBalanceKobo)}
        />
        <StatCard
          label="Funding volume (30d)"
          value={formatKoboAsNaira(stats.last30Days.fundingVolumeKobo)}
          sub={`${stats.last30Days.fundingCount} payments`}
        />
        <StatCard
          label="Purchase volume (30d)"
          value={formatKoboAsNaira(stats.last30Days.purchaseVolumeKobo)}
        />
        <StatCard
          label="Purchase success rate (30d)"
          value={
            stats.last30Days.purchaseSuccessRate != null
              ? `${(stats.last30Days.purchaseSuccessRate * 100).toFixed(1)}%`
              : "No data"
          }
          sub={`${stats.last30Days.purchaseSuccessCount} success · ${stats.last30Days.purchaseFailedCount} failed`}
        />
        <StatCard
          label="Pending purchases"
          value={stats.pendingPurchaseCount.toLocaleString("en-NG")}
          href="/dashboard/purchases?status=pending"
          warn={stats.pendingPurchaseCount > 0}
        />
        <StatCard
          label="Pending payments"
          value={stats.pendingPaymentCount.toLocaleString("en-NG")}
          href="/dashboard/payments?status=initiated"
          warn={stats.pendingPaymentCount > 0}
        />
      </div>

      <p className="mt-6 text-xs text-slate-400">
        Figures with no built-in warehouse/caching layer — see
        packages/db/src/analytics/platform-stats.ts if these queries need to
        scale.
      </p>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  href,
  warn,
}: {
  label: string;
  value: string;
  sub?: string;
  href?: string;
  warn?: boolean;
}) {
  const content = (
    <div
      className={`rounded-xl border bg-white p-5 ${
        warn ? "border-accent/50" : "border-slate-200"
      }`}
    >
      <p className="text-xs font-medium uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
      {sub ? <p className="mt-1 text-xs text-slate-400">{sub}</p> : null}
    </div>
  );

  return href ? (
    <Link href={href} className="block transition-shadow hover:shadow-sm">
      {content}
    </Link>
  ) : (
    content
  );
}
