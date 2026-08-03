"use client";

/**
 * File: apps/web/src/features/auth/components/sign-up-form.tsx
 * Purpose: Client Component rendering the sign-up form. Owns only form
 *          state/UI concerns (react-hook-form + Zod resolver); the actual
 *          account-creation logic lives entirely in the sign-up Server
 *          Action, never here.
 */
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Input, Label, FieldError } from "@credixa/ui";
import { signUpSchema, type SignUpInput } from "../schemas/sign-up-schema";
import { signUpAction } from "../actions/sign-up";

export function SignUpForm({ referralCode }: { referralCode?: string }) {
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { referralCode },
  });

  async function onSubmit(data: SignUpInput) {
    setFormError(null);
    const result = await signUpAction(data);

    // A successful sign-up redirects server-side and never returns here.
    if (!result.success) {
      setFormError(result.error);
      if (result.fieldErrors) {
        for (const [field, message] of Object.entries(result.fieldErrors)) {
          setError(field as keyof SignUpInput, { message });
        }
      }
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
        <Label htmlFor="name">Full name</Label>
        <Input
          id="name"
          autoComplete="name"
          hasError={!!errors.name}
          {...register("name")}
        />
        <FieldError
          {...(errors.name?.message ? { message: errors.name.message } : {})}
        />
      </div>

      <div>
        <Label htmlFor="email">Email address</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          hasError={!!errors.email}
          {...register("email")}
        />
        <FieldError
          {...(errors.email?.message ? { message: errors.email.message } : {})}
        />
      </div>

      <div>
        <Label htmlFor="phone">Phone number</Label>
        <Input
          id="phone"
          type="tel"
          placeholder="08012345678"
          autoComplete="tel"
          hasError={!!errors.phone}
          {...register("phone")}
        />
        <FieldError
          {...(errors.phone?.message ? { message: errors.phone.message } : {})}
        />
      </div>

      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          hasError={!!errors.password}
          {...register("password")}
        />
        <FieldError
          {...(errors.password?.message
            ? { message: errors.password.message }
            : {})}
        />
      </div>

      <div>
        <Label htmlFor="confirmPassword">Confirm password</Label>
        <Input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          hasError={!!errors.confirmPassword}
          {...register("confirmPassword")}
        />
        <FieldError
          {...(errors.confirmPassword?.message
            ? { message: errors.confirmPassword.message }
            : {})}
        />
      </div>

      <div>
        <Label htmlFor="referralCode">Referral code (optional)</Label>
        <Input
          id="referralCode"
          hasError={!!errors.referralCode}
          {...register("referralCode")}
        />
        {referralCode ? (
          <p className="mt-1 text-xs text-primary">
            Applied from your invite link.
          </p>
        ) : null}
        <FieldError
          {...(errors.referralCode?.message
            ? { message: errors.referralCode.message }
            : {})}
        />
      </div>

      <Button
        type="submit"
        className="w-full"
        size="lg"
        isLoading={isSubmitting}
      >
        Create account
      </Button>
    </form>
  );
}
