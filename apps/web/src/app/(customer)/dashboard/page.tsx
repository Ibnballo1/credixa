/**
 * File: apps/web/src/app/(customer)/dashboard/page.tsx
 * Purpose: Customer dashboard — wallet balance, quick actions, and recent
 *          transaction activity. All data comes through feature services,
 *          never direct DB queries in this component.
 */
import { requireAuth } from "@credixa/auth";
import { getOrCreateWallet } from "@/features/wallet/services/wallet-service";
import { WalletBalanceCard } from "@/features/wallet/components/wallet-balance-card";
import { QuickActions } from "@/features/wallet/components/quick-actions";
import { getRecentTransactions } from "@/features/transactions/services/transaction-service";
import { TransactionHistory } from "@/features/transactions/components/transaction-history";

export default async function DashboardPage() {
  const session = await requireAuth();

  const wallet = await getOrCreateWallet(session.user.id);
  const transactions = await getRecentTransactions(wallet.id);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          Welcome, {session.user.name.split(" ")[0]}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Here&apos;s what&apos;s happening with your account.
        </p>
      </div>

      <WalletBalanceCard wallet={wallet} />
      <QuickActions />
      <TransactionHistory transactions={transactions} />
    </div>
  );
}
