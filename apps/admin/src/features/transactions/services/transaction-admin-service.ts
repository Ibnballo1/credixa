// File: apps/admin/src/features/transactions/services/transaction-admin-service.ts
// Purpose: Platform-wide ledger monitoring for Phase 6b.

import { db, createWalletTransactionRepository } from "@credixa/db";
import type {
  WalletTransactionRecord,
  WalletTransactionWithUser,
} from "@credixa/db";

export interface ListTransactionsParams {
  type?: WalletTransactionRecord["type"];
  limit?: number;
  offset?: number;
}

export interface ListTransactionsResult {
  transactions: WalletTransactionWithUser[];
  total: number;
}

export async function listAllTransactions(
  params: ListTransactionsParams,
): Promise<ListTransactionsResult> {
  const walletTransactionRepository = createWalletTransactionRepository(db);
  return walletTransactionRepository.listAllWithUser(params);
}
