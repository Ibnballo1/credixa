/**
 * File: apps/web/src/app/page.tsx
 * Purpose: Root route. Phase 1 has no public marketing site yet — this
 *          simply routes signed-in users to their dashboard and everyone
 *          else to sign-in. The marketing/landing page is out of scope
 *          for this phase and will replace this redirect later.
 */
import { redirect } from "next/navigation";
import { getCurrentSession } from "@credixa/auth";

export default async function RootPage() {
  const session = await getCurrentSession();

  if (session) {
    redirect("/dashboard");
  }

  redirect("/sign-in");
}
