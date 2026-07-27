/**
 * File: apps/admin/src/app/page.tsx
 * Purpose: Root route — routes signed-in admins to the dashboard and
 *          everyone else to sign-in.
 */
import { redirect } from "next/navigation";
import { getCurrentSession } from "@credixa/auth";

export default async function RootPage() {
  const session = await getCurrentSession();

  if (session?.user.role === "admin") {
    redirect("/dashboard");
  }

  redirect("/sign-in");
}
