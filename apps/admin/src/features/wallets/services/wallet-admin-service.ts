// File: apps/admin/src/features/wallets/services/wallet-admin-service.ts
// Purpose: Read-side queries for the admin wallet management area.

import {
  db,
  createWalletRepository,
  createWalletTransactionRepository,
  createWalletHoldRepository,
  createUserRepository,
} from "@credixa/db";
import type {
  WalletRecord,
  WalletTransactionRecord,
  WalletHoldRecord,
} from "@credixa/db";

export interface ListWalletsParams {
  search?: string;
  limit?: number;
  offset?: number;
}

export interface WalletWithUser extends WalletRecord {
  userName: string;
  userEmail: string;
}

export interface ListWalletsResult {
  wallets: WalletWithUser[];
  total: number;
}

export async function listWallets(
  params: ListWalletsParams,
): Promise<ListWalletsResult> {
  const walletRepository = createWalletRepository(db);
  return walletRepository.listWithUser(params);
}

export interface WalletDetail {
  wallet: WalletRecord;
  userName: string;
  userEmail: string;
  recentTransactions: WalletTransactionRecord[];
  pendingHolds: WalletHoldRecord[];
}

export async function getWalletDetail(
  walletId: string,
): Promise<WalletDetail | null> {
  const walletRepository = createWalletRepository(db);
  const walletRow = await walletRepository.findById(walletId);
  if (!walletRow) return null;

  const userRepository = createUserRepository(db);
  const userRow = await userRepository.findById(walletRow.userId);

  const walletTransactionRepository = createWalletTransactionRepository(db);
  const recentTransactions = await walletTransactionRepository.listByWallet(
    walletId,
    20,
  );

  const walletHoldRepository = createWalletHoldRepository(db);
  const pendingHolds = await walletHoldRepository.listPendingByWallet(walletId);

  return {
    wallet: walletRow,
    userName: userRow?.name ?? "Unknown",
    userEmail: userRow?.email ?? "Unknown",
    recentTransactions,
    pendingHolds,
  };
}
