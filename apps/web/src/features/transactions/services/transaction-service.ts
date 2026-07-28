// File: apps/web/src/features/transactions/services/transaction-service.ts
// Purpose: Was deliberately a stub through Phase 2/3 (see
//          docs/database-schema.md's changelog) — Phase 4's `payment`
//          flow is the first thing that actually produces
//          wallet_transaction rows for a real user-facing flow, so this
//          now queries the ledger for real. A "transaction" shown to the
//          customer IS a wallet_transaction row; there's still no
//          separate `transactions` table (see
//          docs/decisions/0008-payment-table-not-generic-transactions.md) —
//          Phase 5 will decide whether VTU purchases need anything this
//          view doesn't already have.

import { db, createWalletTransactionRepository } from "@credixa/db";
import type { WalletTransactionRecord } from "@credixa/db";

export interface TransactionSummary {
  id: string;
  description: string;
  amountKobo: number;
  createdAt: Date;
}

const FALLBACK_DESCRIPTIONS: Record<WalletTransactionRecord["type"], string> = {
  funding: "Wallet funding",
  purchase: "Purchase",
  refund: "Refund",
  reversal: "Reversal",
  commission: "Commission",
  adjustment: "Adjustment",
};

export async function getRecentTransactions(
  walletId: string,
): Promise<TransactionSummary[]> {
  const walletTransactionRepository = createWalletTransactionRepository(db);
  const rows = await walletTransactionRepository.listByWallet(walletId, 20);

  return rows.map((row) => ({
    id: row.id,
    description: row.description ?? FALLBACK_DESCRIPTIONS[row.type],
    amountKobo: row.amount,
    createdAt: row.createdAt,
  }));
}
