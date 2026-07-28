"use client";

/**
 * File: apps/web/src/features/payments/components/fund-wallet-form.tsx
 * Purpose: Amount-entry form for wallet funding. On submit, the server
 *          action redirects the browser to Paystack's hosted checkout —
 *          there is no client-side payment handling here at all, by
 *          design (see initiate-funding.ts's header comment).
 */
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Input, Label, FieldError } from "@credixa/ui";
import {
  fundWalletSchema,
  type FundWalletInput,
} from "../schemas/fund-wallet-schema";
import { initiateFundingAction } from "../actions/initiate-funding";

const QUICK_AMOUNTS = [1_000, 2_000, 5_000, 10_000];

export function FundWalletForm() {
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(fundWalletSchema),
  });

  async function onSubmit(data: FundWalletInput) {
    setFormError(null);
    const result = await initiateFundingAction(data);
    // A successful call redirects server-side and never returns here.
    if (!result.success) {
      setFormError(result.error);
    }
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
        <Label htmlFor="amountNaira">Amount (₦)</Label>
        <Input
          id="amountNaira"
          type="number"
          inputMode="numeric"
          min={100}
          step={100}
          hasError={!!errors.amountNaira}
          {...register("amountNaira")}
        />
        {errors.amountNaira?.message ? (
          <FieldError message={errors.amountNaira.message} />
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        {QUICK_AMOUNTS.map((amount) => (
          <button
            key={amount}
            type="button"
            onClick={() =>
              setValue("amountNaira", amount, { shouldValidate: true })
            }
            className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-primary hover:text-primary"
          >
            ₦{amount.toLocaleString("en-NG")}
          </button>
        ))}
      </div>

      <Button
        type="submit"
        className="w-full"
        size="lg"
        isLoading={isSubmitting}
      >
        Continue to payment
      </Button>

      <p className="text-center text-xs text-slate-400">
        You&apos;ll be redirected to Paystack to complete your payment securely.
      </p>
    </form>
  );
}
