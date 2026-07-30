/**
 * File: apps/admin/src/app/(admin)/dashboard/pricing/page.tsx
 * Purpose: Pricing engine admin surface (Phase 6c, ADR 0010) — view and
 *          create pricing rules.
 */
import type { Metadata } from "next";
import {
  listPricingRules,
  listServicesForPricingForm,
} from "@/features/pricing/services/pricing-admin-service";
import { CreateRuleForm } from "@/features/pricing/components/create-rule-form";
import { RuleRow } from "@/features/pricing/components/rule-row";

export const metadata: Metadata = {
  title: "Pricing — Credixa Admin",
};

export default async function PricingPage() {
  const [rules, services] = await Promise.all([
    listPricingRules(),
    listServicesForPricingForm(),
  ]);

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <div className="md:col-span-2">
        <h1 className="text-2xl font-semibold text-slate-900">Pricing Rules</h1>
        <p className="mt-1 text-sm text-slate-500">
          Rules resolve most-specific first: a rule on a specific service beats
          a blanket rule for its whole service type, which beats the catalog's
          base price.
        </p>

        <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Applies to</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Value</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rules.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-slate-400"
                  >
                    No pricing rules yet — every purchase uses the catalog's
                    base price.
                  </td>
                </tr>
              ) : (
                rules.map((rule) => <RuleRow key={rule.id} rule={rule} />)
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <CreateRuleForm services={services} />
      </div>
    </div>
  );
}
