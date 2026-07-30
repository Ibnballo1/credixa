"use client";

/**
 * File: apps/admin/src/features/pricing/components/rule-row.tsx
 * Purpose: One row in the pricing rules table, with an active toggle.
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { setPricingRuleActiveAction } from "../actions/manage-pricing-rule";
import type { PricingRuleWithLabel } from "../services/pricing-admin-service";

export function RuleRow({ rule }: { rule: PricingRuleWithLabel }) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function handleToggle() {
    setIsPending(true);
    await setPricingRuleActiveAction(rule.id, !rule.isActive);
    setIsPending(false);
    router.refresh();
  }

  const valueLabel =
    rule.ruleType === "flat_price"
      ? `₦${((rule.flatPriceKobo ?? 0) / 100).toLocaleString("en-NG")}`
      : `${((rule.discountBasisPoints ?? 0) / 100).toFixed(2)}% off`;

  return (
    <tr className="hover:bg-slate-50">
      <td className="px-4 py-3 font-medium text-slate-900">
        {rule.targetLabel}
      </td>
      <td className="px-4 py-3 text-slate-500">{rule.role}</td>
      <td className="px-4 py-3 text-slate-500">{rule.ruleType}</td>
      <td className="px-4 py-3 font-medium text-slate-900">{valueLabel}</td>
      <td className="px-4 py-3">
        <button
          type="button"
          onClick={handleToggle}
          disabled={isPending}
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            rule.isActive
              ? "bg-primary/10 text-primary"
              : "bg-slate-100 text-slate-500"
          }`}
        >
          {rule.isActive ? "Active" : "Disabled"}
        </button>
      </td>
    </tr>
  );
}
