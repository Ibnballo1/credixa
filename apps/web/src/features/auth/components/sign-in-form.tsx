"use client";

/**
 * File: apps/web/src/features/auth/components/sign-in-form.tsx
 * Purpose: Client Component rendering the sign-in form.
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
      setFormError("error" in result ? result.error : "Sign in failed.");
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
        />
        {errors.email?.message ? (
          <FieldError message={errors.email.message} />
        ) : null}
      </div>

      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          hasError={!!errors.password}
          {...register("password")}
        />
        {errors.password?.message ? (
          <FieldError message={errors.password.message} />
        ) : null}
      </div>

      <Button
        type="submit"
        className="text-white h-11 w-full"
        size="lg"
        isLoading={isSubmitting}
      >
        Sign in
      </Button>
    </form>
  );
}
