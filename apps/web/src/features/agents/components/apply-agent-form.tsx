"use client";

/**
 * File: apps/web/src/features/agents/components/apply-agent-form.tsx
 * Purpose: "Become an agent" application form.
 */
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Input, Label, FieldError } from "@credixa/ui";
import {
  applyAgentSchema,
  type ApplyAgentInput,
} from "../schemas/apply-agent-schema";
import { applyAgentAction } from "../actions/apply-agent";

export function ApplyAgentForm() {
  const [formError, setFormError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ApplyAgentInput>({
    resolver: zodResolver(applyAgentSchema),
  });

  async function onSubmit(data: ApplyAgentInput) {
    setFormError(null);
    const result = await applyAgentAction(data);
    if (!result.success) {
      setFormError(result.error);
      return;
    }
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-6 text-center">
        <p className="text-sm font-medium text-slate-900">
          Application submitted
        </p>
        <p className="mt-1 text-xs text-slate-500">
          We&apos;ll review your application and notify you once it&apos;s
          approved.
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
        <Label htmlFor="businessName">Business name</Label>
        <Input
          id="businessName"
          hasError={!!errors.businessName}
          {...register("businessName")}
        />
        {errors.businessName?.message ? (
          <FieldError message={errors.businessName.message} />
        ) : null}
      </div>

      <Button
        type="submit"
        className="w-full"
        size="lg"
        isLoading={isSubmitting}
      >
        Submit application
      </Button>
    </form>
  );
}
