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

export function SignUpForm() {
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
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
        {errors.name?.message ? (
          <FieldError message={errors.name.message} />
        ) : null}
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
        {errors.email?.message ? (
          <FieldError message={errors.email.message} />
        ) : null}
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
        {errors.phone?.message ? (
          <FieldError message={errors.phone.message} />
        ) : null}
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
        {errors.password?.message ? (
          <FieldError message={errors.password.message} />
        ) : null}
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
        {errors.confirmPassword?.message ? (
          <FieldError message={errors.confirmPassword.message} />
        ) : null}
      </div>

      <Button
        type="submit"
        className="h-11 text-white w-full"
        size="lg"
        isLoading={isSubmitting}
      >
        Create account
      </Button>
    </form>
  );
}
