/**
 * File: apps/admin/src/app/(admin)/dashboard/referrals/page.tsx
 * Purpose: Platform-wide referral monitoring.
 */
import type { Metadata } from "next";
import { listAllReferrals } from "@/features/referrals/services/referral-admin-service";

export const metadata: Metadata = {
  title: "Referrals — Credixa Admin",
};

export default async function AdminReferralsPage() {
  const referrals = await listAllReferrals();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Referrals</h1>
        <span className="text-sm text-slate-500">{referrals.length} total</span>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Referrer</th>
              <th className="px-4 py-3">Referred</th>
              <th className="px-4 py-3">Code used</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {referrals.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-slate-400"
                >
                  No referrals yet.
                </td>
              </tr>
            ) : (
              referrals.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">
                      {r.referrerUserName}
                    </p>
                    <p className="text-xs text-slate-400">
                      {r.referrerUserEmail}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">
                      {r.referredUserName}
                    </p>
                    <p className="text-xs text-slate-400">
                      {r.referredUserEmail}
                    </p>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">
                    {r.referralCode}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        r.status === "qualified"
                          ? "bg-primary/10 text-primary"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {r.createdAt.toLocaleDateString("en-NG", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
