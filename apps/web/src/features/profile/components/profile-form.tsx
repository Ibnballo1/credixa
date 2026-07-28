"use client";

/**
 * File: apps/web/src/features/profile/components/profile-form.tsx
 * Purpose: Editable name/phone fields, read-only email, and a KYC status
 *          badge. Email isn't editable here — see update-profile action's
 *          header comment for why.
 */
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Input, Label, FieldError } from "@credixa/ui";
import {
  updateProfileSchema,
  type UpdateProfileInput,
} from "../schemas/update-profile-schema";
import { updateProfileAction } from "../actions/update-profile";

const KYC_STATUS_LABELS: Record<string, { label: string; className: string }> =
  {
    unverified: {
      label: "Unverified",
      className: "bg-slate-100 text-slate-600",
    },
    pending: {
      label: "Pending review",
      className: "bg-amber-100 text-amber-700",
    },
    verified: { label: "Verified", className: "bg-primary/10 text-primary" },
    rejected: { label: "Rejected", className: "bg-red-100 text-red-700" },
  };

interface ProfileFormProps {
  email: string;
  kycStatus: string;
  defaultValues: UpdateProfileInput;
}

export function ProfileForm({
  email,
  kycStatus,
  defaultValues,
}: ProfileFormProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues,
  });

  async function onSubmit(data: UpdateProfileInput) {
    setFormError(null);
    setSuccessMessage(null);
    const result = await updateProfileAction(data);
    if (!result.success) {
      setFormError(result.error);
      return;
    }
    setSuccessMessage("Profile updated");
  }

  const kyc = KYC_STATUS_LABELS[kycStatus] ?? KYC_STATUS_LABELS.unverified;

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
      {successMessage ? (
        <div
          role="status"
          className="rounded-md border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary"
        >
          {successMessage}
        </div>
      ) : null}

      <div>
        <Label>Email address</Label>
        <Input value={email} disabled readOnly />
        <p className="mt-1 text-xs text-slate-400">
          Email changes aren&apos;t supported yet.
        </p>
      </div>

      <div>
        <Label>Verification status</Label>
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${kyc!.className}`}
        >
          {kyc!.label}
        </span>
      </div>

      <div>
        <Label htmlFor="name">Full name</Label>
        <Input id="name" hasError={!!errors.name} {...register("name")} />
        <FieldError
          {...(errors.name?.message ? { message: errors.name.message } : {})}
        />
      </div>

      <div>
        <Label htmlFor="phone">Phone number</Label>
        <Input
          id="phone"
          type="tel"
          hasError={!!errors.phone}
          {...register("phone")}
        />
        <FieldError
          {...(errors.phone?.message ? { message: errors.phone.message } : {})}
        />
      </div>

      <Button type="submit" isLoading={isSubmitting}>
        Save changes
      </Button>
    </form>
  );
}
