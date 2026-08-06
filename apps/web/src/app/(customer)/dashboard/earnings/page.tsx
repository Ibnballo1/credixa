/**
 * File: apps/web/src/app/(customer)/dashboard/earnings/page.tsx
 * Purpose: Commission history — referral bonuses and (for agents) margin
 *          cashback.
 */
import type { Metadata } from "next";
import { requireAuth } from "@credixa/auth";
import { formatKoboAsNaira } from "@credixa/lib";
import { getMyEarnings } from "@/features/earnings/services/earnings-service";

export const metadata: Metadata = {
  title: "Earnings — Credixa",
};

const TYPE_LABELS: Record<string, string> = {
  referral: "Referral bonus",
  agent_margin: "Agent margin",
};

export default async function EarningsPage() {
  const session = await requireAuth();
  const { commissions, totalPaidKobo } = await getMyEarnings(session.user.id);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 text-2xl font-semibold text-slate-900">Earnings</h1>
      <p className="mb-6 text-sm text-slate-500">
        Referral bonuses and agent margin cashback, credited straight to your
        wallet.
      </p>

      <div className="rounded-xl bg-gradient-to-br from-primary to-primary/80 p-6 text-primary-foreground">
        <span className="text-sm font-medium text-white/80">Total earned</span>
        <p className="mt-1 text-3xl font-semibold">
          {formatKoboAsNaira(totalPaidKobo)}
        </p>
      </div>

      <div className="mt-6">
        {commissions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-400">
            No earnings yet. Refer a friend or, if you&apos;re an agent, keep
            buying — earnings show up here automatically.
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
            {commissions.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-medium text-slate-900">
                    {TYPE_LABELS[c.type] ?? c.type}
                  </p>
                  <p className="text-xs text-slate-400">
                    {c.createdAt.toLocaleDateString("en-NG", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className={`font-semibold ${
                      c.status === "paid" ? "text-primary" : "text-slate-500"
                    }`}
                  >
                    +{formatKoboAsNaira(c.amountKobo)}
                  </p>
                  {c.status !== "paid" ? (
                    <p className="text-xs text-slate-400">{c.status}</p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
