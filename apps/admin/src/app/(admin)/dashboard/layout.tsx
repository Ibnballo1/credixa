/**
 * File: apps/admin/src/app/(admin)/dashboard/layout.tsx
 * Purpose: Authoritative auth+role boundary for the entire admin area.
 */
import { requireRole } from "@credixa/auth";
import { Header } from "@/components/header";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireRole("admin");

  return (
    <div className="min-h-screen bg-slate-50">
      <Header session={session} />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 md:py-8">
        {children}
      </main>
    </div>
  );
}
