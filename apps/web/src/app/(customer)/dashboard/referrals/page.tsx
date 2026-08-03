/**
 * File: apps/web/src/app/(customer)/dashboard/referrals/page.tsx
 * Purpose: The customer's referral code, shareable link, and the list
 *          of people they've referred with qualification status.
 */
import type { Metadata } from "next";
import { requireAuth } from "@credixa/auth";
import { getMyReferrals } from "@/features/referrals/services/referral-service";
import { CopyReferralLink } from "@/features/referrals/components/copy-referral-link";

export const metadata: Metadata = {
  title: "Referrals — Credixa",
};

export default async function ReferralsPage() {
  const session = await requireAuth();
  const { code, referrals } = await getMyReferrals(session.user.id);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const shareLink = `${appUrl}/sign-up?ref=${code.code}`;
  const qualifiedCount = referrals.filter(
    (r) => r.status === "qualified",
  ).length;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 text-2xl font-semibold text-slate-900">Referrals</h1>
      <p className="mb-6 text-sm text-slate-500">
        Share your link — when someone signs up and funds their wallet, your
        referral qualifies.
      </p>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <p className="mb-2 text-sm font-medium text-slate-700">
          Your referral code
        </p>
        <p className="mb-4 font-mono text-lg font-semibold text-primary">
          {code.code}
        </p>
        <CopyReferralLink link={shareLink} />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium uppercase text-slate-500">
            Total referred
          </p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">
            {referrals.length}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium uppercase text-slate-500">
            Qualified
          </p>
          <p className="mt-1 text-2xl font-semibold text-primary">
            {qualifiedCount}
          </p>
        </div>
      </div>

      <div className="mt-6">
        <h2 className="mb-2 text-sm font-medium text-slate-700">
          Your referrals
        </h2>
        {referrals.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-400">
            No referrals yet — share your link to get started.
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
            {referrals.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-medium text-slate-900">
                    {r.referredUserName}
                  </p>
                  <p className="text-xs text-slate-400">
                    Joined{" "}
                    {r.createdAt.toLocaleDateString("en-NG", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    r.status === "qualified"
                      ? "bg-primary/10 text-primary"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {r.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
