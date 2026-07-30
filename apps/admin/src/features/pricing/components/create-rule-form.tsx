"use client";

/**
 * File: apps/admin/src/features/pricing/components/create-rule-form.tsx
 * Purpose: Form for creating a new pricing rule — target (specific
 *          service or a whole service type), role, and either a flat
 *          price or a discount percentage depending on rule type.
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Label } from "@credixa/ui";
import { CREDIXA_ROLES, type CredixaRole } from "@credixa/types";
import { createPricingRuleAction } from "../actions/manage-pricing-rule";
import type { ServiceRecord } from "@credixa/db";

const SERVICE_TYPES = ["airtime", "data", "electricity", "cable"] as const;

export function CreateRuleForm({ services }: { services: ServiceRecord[] }) {
  const router = useRouter();
  const [targetType, setTargetType] = useState<"service" | "service_type">(
    "service_type",
  );
  const [serviceId, setServiceId] = useState("");
  const [serviceType, setServiceType] =
    useState<(typeof SERVICE_TYPES)[number]>("airtime");
  const [role, setRole] = useState<CredixaRole>("agent");
  const [ruleType, setRuleType] = useState<"flat_price" | "discount_percent">(
    "discount_percent",
  );
  const [flatPriceNaira, setFlatPriceNaira] = useState("");
  const [discountPercent, setDiscountPercent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result = await createPricingRuleAction({
      targetType,
      ...(targetType === "service" ? { serviceId } : { serviceType }),
      role,
      ruleType,
      ...(ruleType === "flat_price"
        ? { flatPriceNaira: Number(flatPriceNaira) }
        : { discountPercent: Number(discountPercent) }),
    });

    setIsSubmitting(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setFlatPriceNaira("");
    setDiscountPercent("");
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-xl border border-slate-200 bg-white p-6"
    >
      <h2 className="text-sm font-medium text-slate-700">New pricing rule</h2>

      {error ? (
        <div
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700"
        >
          {error}
        </div>
      ) : null}

      <div>
        <Label htmlFor="targetType">Applies to</Label>
        <select
          id="targetType"
          value={targetType}
          onChange={(e) =>
            setTargetType(e.target.value as "service" | "service_type")
          }
          className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
        >
          <option value="service_type">Every service of a type</option>
          <option value="service">One specific service</option>
        </select>
      </div>

      {targetType === "service_type" ? (
        <div>
          <Label htmlFor="serviceType">Service type</Label>
          <select
            id="serviceType"
            value={serviceType}
            onChange={(e) =>
              setServiceType(e.target.value as (typeof SERVICE_TYPES)[number])
            }
            className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
          >
            {SERVICE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div>
          <Label htmlFor="serviceId">Service</Label>
          <select
            id="serviceId"
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value)}
            className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
          >
            <option value="">Select a service</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <Label htmlFor="role">Role</Label>
        <select
          id="role"
          value={role}
          onChange={(e) => setRole(e.target.value as CredixaRole)}
          className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
        >
          {CREDIXA_ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      <div>
        <Label htmlFor="ruleType">Rule type</Label>
        <select
          id="ruleType"
          value={ruleType}
          onChange={(e) =>
            setRuleType(e.target.value as "flat_price" | "discount_percent")
          }
          className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
        >
          <option value="discount_percent">
            Discount percentage (variable-amount services)
          </option>
          <option value="flat_price">Flat price (fixed-price plans)</option>
        </select>
      </div>

      {ruleType === "flat_price" ? (
        <div>
          <Label htmlFor="flatPriceNaira">Flat price (₦)</Label>
          <Input
            id="flatPriceNaira"
            type="number"
            value={flatPriceNaira}
            onChange={(e) => setFlatPriceNaira(e.target.value)}
          />
        </div>
      ) : (
        <div>
          <Label htmlFor="discountPercent">Discount (%)</Label>
          <Input
            id="discountPercent"
            type="number"
            step="0.01"
            value={discountPercent}
            onChange={(e) => setDiscountPercent(e.target.value)}
          />
        </div>
      )}

      <Button type="submit" className="w-full" isLoading={isSubmitting}>
        Create rule
      </Button>
    </form>
  );
}
