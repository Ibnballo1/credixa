"use client";

/**
 * File: apps/admin/src/features/auth/components/sign-in-form.tsx
 * Purpose: Client Component rendering the admin sign-in form.
 */
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Input, Label, FieldError } from "@credixa/ui";
import { signInSchema, type SignInInput } from "../schemas/sign-in-schema";
import { signInAction } from "../actions/sign-in";

export function SignInForm() {
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
  });

  async function onSubmit(data: SignInInput) {
    setFormError(null);
    const result = await signInAction(data);
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
        <Label htmlFor="email">Email address</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          hasError={!!errors.email}
          {...register("email")}
          className="h-11 w-full px-3"
        />
        <FieldError
          {...(errors.email?.message ? { message: errors.email.message } : {})}
        />
      </div>

      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          hasError={!!errors.password}
          {...register("password")}
          className="h-11 w-full px-3"
        />
        <FieldError
          {...(errors.password?.message
            ? { message: errors.password.message }
            : {})}
        />
      </div>

      <Button
        type="submit"
        className="h-11 text-white w-full"
        size="lg"
        isLoading={isSubmitting}
      >
        Sign in
      </Button>
    </form>
  );
}
