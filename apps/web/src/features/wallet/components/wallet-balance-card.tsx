/**
 * File: apps/web/src/features/wallet/components/wallet-balance-card.tsx
 * Purpose: Displays the user's wallet balance. Server Component — reads
 *          are cheap enough here to do server-side without a client
 *          loading state; Phase 3 will revisit this once balance can
 *          actually change and optimistic updates matter.
 */
import { Wallet as WalletIcon } from "lucide-react";
import { formatKoboAsNaira } from "@credixa/lib";
import type { WalletRecord } from "@credixa/db";

export function WalletBalanceCard({ wallet }: { wallet: WalletRecord }) {
  return (
    <div className="rounded-xl bg-gradient-to-br from-primary to-primary/80 p-6 text-primary-foreground shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-white/80">
          Wallet balance
        </span>
        <WalletIcon className="h-5 w-5 text-white/80" />
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight">
        {formatKoboAsNaira(wallet.balance)}
      </p>
      <p className="mt-2 text-xs text-white/70">
        Wallet funding is coming soon — you&apos;ll be able to top up here.
      </p>
    </div>
  );
}
