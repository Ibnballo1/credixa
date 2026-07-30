"use client";

/**
 * File: apps/admin/src/features/services/components/provider-row.tsx
 * Purpose: One editable row in the providers table — toggle active,
 *          edit priority inline.
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  toggleProviderActiveAction,
  updateProviderPriorityAction,
} from "../actions/manage-service";
import type { ProviderRecord } from "@credixa/db";

export function ProviderRow({ provider }: { provider: ProviderRecord }) {
  const router = useRouter();
  const [priority, setPriority] = useState(String(provider.priority));
  const [isPending, setIsPending] = useState(false);

  async function handleToggle() {
    setIsPending(true);
    await toggleProviderActiveAction(provider.id, !provider.isActive);
    setIsPending(false);
    router.refresh();
  }

  async function handlePriorityBlur() {
    const parsed = Number(priority);
    if (Number.isInteger(parsed) && parsed !== provider.priority) {
      setIsPending(true);
      await updateProviderPriorityAction(provider.id, parsed);
      setIsPending(false);
      router.refresh();
    }
  }

  return (
    <tr className="hover:bg-slate-50">
      <td className="px-4 py-3 font-medium text-slate-900">
        {provider.displayName}
      </td>
      <td className="px-4 py-3 text-slate-500">{provider.name}</td>
      <td className="px-4 py-3">
        <input
          type="number"
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          onBlur={handlePriorityBlur}
          disabled={isPending}
          className="h-8 w-20 rounded-md border border-slate-300 px-2 text-sm"
        />
      </td>
      <td className="px-4 py-3 text-xs text-slate-500">
        {[
          provider.supportsAirtime && "Airtime",
          provider.supportsData && "Data",
          provider.supportsElectricity && "Electricity",
          provider.supportsCable && "Cable",
        ]
          .filter(Boolean)
          .join(", ") || "None"}
      </td>
      <td className="px-4 py-3">
        <button
          type="button"
          onClick={handleToggle}
          disabled={isPending}
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            provider.isActive
              ? "bg-primary/10 text-primary"
              : "bg-slate-100 text-slate-500"
          }`}
        >
          {provider.isActive ? "Active" : "Disabled"}
        </button>
      </td>
    </tr>
  );
}
