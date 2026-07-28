/**
 * File: apps/web/src/features/wallet/components/quick-actions.tsx
 * Purpose: The dashboard's quick-action grid. "Fund wallet" went live in
 *          Phase 4 — it's a real link now, not a disabled placeholder.
 *          The VTU actions (airtime, data, electricity, cable) stay
 *          disabled with a "Soon" badge until Phase 5. Rendering them as
 *          inert-but-visible (rather than omitting them) sets the right
 *          expectation: the feature exists and is coming, not broken.
 */
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Wallet, Smartphone, Wifi, Zap, Tv } from "lucide-react";

interface QuickAction {
  label: string;
  icon: LucideIcon;
  /** Omit to render as a disabled "Soon" card. */
  href?: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  { label: "Fund wallet", icon: Wallet, href: "/dashboard/fund" },
  { label: "Buy airtime", icon: Smartphone },
  { label: "Buy data", icon: Wifi },
  { label: "Pay electricity", icon: Zap },
  { label: "Cable TV", icon: Tv },
];

export function QuickActions() {
  return (
    <div>
      <h2 className="mb-3 text-sm font-medium text-slate-700">Quick actions</h2>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
        {QUICK_ACTIONS.map(({ label, icon: Icon, href }) =>
          href ? (
            <Link
              key={label}
              href={href}
              className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-4 text-center transition-colors hover:border-primary hover:bg-primary/5"
            >
              <Icon className="h-5 w-5 text-primary" />
              <span className="text-xs font-medium text-slate-700">
                {label}
              </span>
            </Link>
          ) : (
            <button
              key={label}
              type="button"
              disabled
              className="relative flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-4 text-center opacity-60 cursor-not-allowed"
            >
              <span className="absolute -top-2 -right-2 rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-accent-foreground">
                Soon
              </span>
              <Icon className="h-5 w-5 text-slate-500" />
              <span className="text-xs font-medium text-slate-600">
                {label}
              </span>
            </button>
          ),
        )}
      </div>
    </div>
  );
}
