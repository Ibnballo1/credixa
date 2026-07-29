import { Logo } from "@credixa/ui";

/**
 * File: apps/admin/src/app/(auth)/layout.tsx
 * Purpose: Shared shell for the admin sign-in page.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-12">
      <div className="mb-8 flex flex-col items-center gap-2">
        <Logo size="sm" className="w-12 h-12" />
        {/* <h1 className="text-lg font-medium">Sign in to your account</h1> */}
      </div>
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        {children}
      </div>
    </div>
  );
}
