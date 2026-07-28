// File: packages/db/src/ledger/reconciliation.ts
// Purpose: The safety net for the whole ledger design. `wallet.balance` is
//          only ever supposed to change alongside a wallet_transaction
//          row (see wallet-ledger.ts / wallet-holds.ts) — this module
//          verifies that's actually true by independently recomputing
//          balance from the ledger and comparing. Any drift means a bug
//          somewhere wrote to wallet.balance outside the sanctioned path.
//          Consumed by the scheduled Inngest job in
//          packages/lib/src/jobs/wallet-reconciliation.ts.

import { eq } from "drizzle-orm";
import type { Database } from "../client";
import { wallet } from "../schema";
import { createWalletTransactionRepository } from "../repositories/wallet-transaction-repository";

export interface WalletReconciliationReport {
  walletId: string;
  cachedBalance: number;
  ledgerBalance: number;
  /** cachedBalance - ledgerBalance. Zero means healthy. */
  driftKobo: number;
  isHealthy: boolean;
}

export async function reconcileWalletBalance(
  db: Database,
  walletId: string,
): Promise<WalletReconciliationReport> {
  const [walletRow] = await db
    .select()
    .from(wallet)
    .where(eq(wallet.id, walletId))
    .limit(1);
  if (!walletRow) {
    throw new Error(`reconcileWalletBalance: wallet ${walletId} not found`);
  }

  const walletTransactionRepository = createWalletTransactionRepository(db);
  const ledgerBalance = await walletTransactionRepository.sumByWallet(walletId);
  const driftKobo = walletRow.balance - ledgerBalance;

  return {
    walletId,
    cachedBalance: walletRow.balance,
    ledgerBalance,
    driftKobo,
    isHealthy: driftKobo === 0,
  };
}

/**
 * Reconciles every wallet, sequentially. Sequential (not
 * Promise.all-parallel) is deliberate — this runs on a schedule, not in
 * a user-facing request path, so trading a few extra seconds of runtime
 * for not opening one DB connection per wallet at once is the right
 * call while the wallet count is small. Revisit with batching/paging if
 * wallet count grows large enough to make a full scheduled scan slow.
 */
export async function reconcileAllWallets(
  db: Database,
): Promise<WalletReconciliationReport[]> {
  const wallets = await db.select({ id: wallet.id }).from(wallet);
  const reports: WalletReconciliationReport[] = [];

  for (const row of wallets) {
    reports.push(await reconcileWalletBalance(db, row.id));
  }

  return reports;
}
