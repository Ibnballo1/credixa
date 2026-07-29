"use client";

/**
 * File: apps/web/src/features/vtu/components/data-purchase-form.tsx
 * Purpose: Data bundle purchase form. No amount field — price is fixed
 *          per plan and shown next to each option; the actual charge is
 *          re-derived server-side from the catalog, never trusted from
 *          this form (see purchase-data.ts).
 */
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Input, Label, FieldError } from "@credixa/ui";
import { formatKoboAsNaira } from "@credixa/lib";
import type { ServiceRecord } from "@credixa/db";
import {
  dataPurchaseSchema,
  type DataPurchaseInput,
} from "../schemas/data-purchase-schema";
import { purchaseDataAction } from "../actions/purchase-data";

export function DataPurchaseForm({ plans }: { plans: ServiceRecord[] }) {
  const idempotencyKey = useMemo(() => crypto.randomUUID(), []);
  const [formError, setFormError] = useState<string | null>(null);
  const [successStatus, setSuccessStatus] = useState<
    "success" | "pending" | null
  >(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DataPurchaseInput>({
    resolver: zodResolver(dataPurchaseSchema),
  });

  async function onSubmit(data: DataPurchaseInput) {
    setFormError(null);
    const result = await purchaseDataAction({ ...data, idempotencyKey });
    if (!result.success) {
      setFormError(result.error);
      return;
    }
    setSuccessStatus(result.status);
  }

  if (successStatus) {
    return (
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-6 text-center">
        <p className="text-sm font-medium text-slate-900">
          {successStatus === "success"
            ? "Data purchase successful"
            : "Purchase submitted — confirming with your network"}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          {successStatus === "success"
            ? "The recipient's data bundle should activate shortly."
            : "This usually settles within a few minutes. Check your transaction history for the final status."}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      {formError ? (
        <div
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {formError}
        </div>
      ) : null}

      <div>
        <Label htmlFor="serviceId">Data plan</Label>
        <select
          id="serviceId"
          className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          {...register("serviceId")}
        >
          <option value="">Select a plan</option>
          {plans.map((plan) => (
            <option key={plan.id} value={plan.id}>
              {plan.name} —{" "}
              {plan.priceKobo != null
                ? formatKoboAsNaira(plan.priceKobo)
                : "N/A"}
            </option>
          ))}
        </select>
        <FieldError message={errors.serviceId?.message} />
      </div>

      <div>
        <Label htmlFor="recipientPhone">Phone number</Label>
        <Input
          id="recipientPhone"
          type="tel"
          placeholder="08012345678"
          hasError={!!errors.recipientPhone}
          {...register("recipientPhone")}
        />
        <FieldError message={errors.recipientPhone?.message} />
      </div>

      <Button
        type="submit"
        className="w-full"
        size="lg"
        isLoading={isSubmitting}
      >
        Buy data
      </Button>
    </form>
  );
}
