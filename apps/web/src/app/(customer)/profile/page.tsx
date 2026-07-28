/**
 * File: apps/web/src/app/(customer)/profile/page.tsx
 * Purpose: Profile management page.
 */
import type { Metadata } from "next";
import { requireAuth } from "@credixa/auth";
import { ProfileForm } from "@/features/profile/components/profile-form";

export const metadata: Metadata = {
  title: "Your profile — Credixa",
};

export default async function ProfilePage() {
  const session = await requireAuth();

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">
        Your profile
      </h1>
      <ProfileForm
        email={session.user.email}
        kycStatus={session.user.kycStatus ?? "unverified"}
        defaultValues={{
          name: session.user.name,
          phone: session.user.phone ?? "",
        }}
      />
    </div>
  );
}
