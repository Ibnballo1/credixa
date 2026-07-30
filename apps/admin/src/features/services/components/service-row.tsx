"use client";

/**
 * File: apps/admin/src/features/services/components/service-row.tsx
 * Purpose: One editable row in the services table — toggle active, edit
 *          price inline (only for data/cable plans, which have a fixed
 *          price; airtime/electricity show "Variable" instead since
 *          the amount is user-entered per purchase).
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  toggleServiceActiveAction,
  updateServicePriceAction,
} from "../actions/manage-service";
import type { ServiceRecord } from "@credixa/db";

export function ServiceRow({ service }: { service: ServiceRecord }) {
  const router = useRouter();
  const hasFixedPrice = service.priceKobo != null;
  const [priceNaira, setPriceNaira] = useState(
    hasFixedPrice ? String(service.priceKobo! / 100) : "",
  );
  const [isPending, setIsPending] = useState(false);

  async function handleToggle() {
    setIsPending(true);
    await toggleServiceActiveAction(service.id, !service.isActive);
    setIsPending(false);
    router.refresh();
  }

  async function handlePriceBlur() {
    const parsed = Number(priceNaira);
    if (
      Number.isInteger(parsed) &&
      parsed > 0 &&
      parsed * 100 !== service.priceKobo
    ) {
      setIsPending(true);
      await updateServicePriceAction(service.id, parsed);
      setIsPending(false);
      router.refresh();
    }
  }

  return (
    <tr className="hover:bg-slate-50">
      <td className="px-4 py-3 font-medium text-slate-900">{service.name}</td>
      <td className="px-4 py-3 text-slate-500">{service.type}</td>
      <td className="px-4 py-3 text-slate-500">{service.network}</td>
      <td className="px-4 py-3">
        {hasFixedPrice ? (
          <div className="flex items-center gap-1">
            <span className="text-slate-400">₦</span>
            <input
              type="number"
              value={priceNaira}
              onChange={(e) => setPriceNaira(e.target.value)}
              onBlur={handlePriceBlur}
              disabled={isPending}
              className="h-8 w-24 rounded-md border border-slate-300 px-2 text-sm"
            />
          </div>
        ) : (
          <span className="text-xs text-slate-400">
            Variable (user-entered)
          </span>
        )}
      </td>
      <td className="px-4 py-3">
        <button
          type="button"
          onClick={handleToggle}
          disabled={isPending}
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            service.isActive
              ? "bg-primary/10 text-primary"
              : "bg-slate-100 text-slate-500"
          }`}
        >
          {service.isActive ? "Active" : "Disabled"}
        </button>
      </td>
    </tr>
  );
}
