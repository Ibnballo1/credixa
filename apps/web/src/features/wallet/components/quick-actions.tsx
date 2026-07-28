/**
 * File: apps/web/src/features/wallet/components/quick-actions.tsx
 * Purpose: The dashboard's quick-action grid (fund wallet, airtime, data,
 *          electricity, cable TV). Every action is disabled with a
 *          "Soon" badge for Phase 2 — wallet funding lands in Phase 4,
 *          VTU services in Phase 5. Rendering these as inert-but-visible
 *          (rather than omitting them) sets the right expectation: the
 *          feature exists and is coming, not broken.
 */
import type { LucideIcon } from "lucide-react";
import { Wallet, Smartphone, Wifi, Zap, Tv } from "lucide-react";

interface QuickAction {
  label: string;
  icon: LucideIcon;
}

const QUICK_ACTIONS: QuickAction[] = [
  { label: "Fund wallet", icon: Wallet },
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
        {QUICK_ACTIONS.map(({ label, icon: Icon }) => (
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
            <span className="text-xs font-medium text-slate-600">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
