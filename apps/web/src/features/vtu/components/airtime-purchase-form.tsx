"use client";

/**
 * File: apps/web/src/features/vtu/components/airtime-purchase-form.tsx
 * Purpose: Airtime purchase form. Generates a stable idempotency key once
 *          per form mount (not per submit) — a double-click or a slow
 *          network causing a duplicate submit reuses the SAME key, so
 *          initiatePurchase's idempotency check (not this component)
 *          is what actually prevents a double purchase; this is just
 *          what makes that protection reachable from the UI at all.
 */
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { Button, Input, Label, FieldError } from "@credixa/ui";
import type { ServiceRecord } from "@credixa/db";
import {
  airtimePurchaseSchema,
  type AirtimePurchaseInput,
} from "../schemas/airtime-purchase-schema";
import { purchaseAirtimeAction } from "../actions/purchase-airtime";

const QUICK_AMOUNTS = [100, 200, 500, 1_000];

export function AirtimePurchaseForm({
  networks,
}: {
  networks: ServiceRecord[];
}) {
  const idempotencyKey = useMemo(() => crypto.randomUUID(), []);
  const [formError, setFormError] = useState<string | null>(null);
  const [successStatus, setSuccessStatus] = useState<
    "success" | "pending" | null
  >(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<
    z.input<typeof airtimePurchaseSchema>,
    any,
    z.output<typeof airtimePurchaseSchema>
  >({
    resolver: zodResolver(airtimePurchaseSchema),
  });

  async function onSubmit(data: AirtimePurchaseInput) {
    setFormError(null);
    const result = await purchaseAirtimeAction({ ...data, idempotencyKey });
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
            ? "Airtime purchase successful"
            : "Purchase submitted — confirming with your network"}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          {successStatus === "success"
            ? "The recipient should receive their airtime shortly."
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
        <Label htmlFor="serviceId">Network</Label>
        <select
          id="serviceId"
          className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          {...register("serviceId")}
        >
          <option value="">Select network</option>
          {networks.map((network) => (
            <option key={network.id} value={network.id}>
              {network.name}
            </option>
          ))}
        </select>
        {errors.serviceId?.message ? (
          <FieldError message={errors.serviceId.message} />
        ) : null}
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
        {errors.recipientPhone?.message ? (
          <FieldError message={errors.recipientPhone.message} />
        ) : null}
      </div>

      <div>
        <Label htmlFor="amountNaira">Amount (₦)</Label>
        <Input
          id="amountNaira"
          type="number"
          inputMode="numeric"
          hasError={!!errors.amountNaira}
          {...register("amountNaira", { valueAsNumber: true })}
        />
        {errors.amountNaira?.message ? (
          <FieldError message={errors.amountNaira.message} />
        ) : null}
        <div className="mt-2 flex flex-wrap gap-2">
          {QUICK_AMOUNTS.map((amount) => (
            <button
              key={amount}
              type="button"
              onClick={() =>
                setValue("amountNaira", amount, { shouldValidate: true })
              }
              className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-primary hover:text-primary"
            >
              ₦{amount}
            </button>
          ))}
        </div>
      </div>

      <Button
        type="submit"
        className="w-full"
        size="lg"
        isLoading={isSubmitting}
      >
        Buy airtime
      </Button>
    </form>
  );
}
