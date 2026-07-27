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
      <div className="mb-8 flex items-center gap-2">
        <div className="h-8 w-8 rounded-md bg-primary" />
        <span className="text-xl font-semibold text-slate-900">
          Credixa Admin
        </span>
      </div>
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        {children}
      </div>
    </div>
  );
}
