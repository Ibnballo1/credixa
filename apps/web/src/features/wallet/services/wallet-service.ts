// File: apps/web/src/features/wallet/services/wallet-service.ts
// Purpose: Application-service layer for wallet reads. This is the only
//          place the get-or-create pattern is invoked — pages/components
//          call `getOrCreateWallet`, never the repository directly.

import { db, createWalletRepository, type WalletRecord } from "@credixa/db";

const walletRepository = createWalletRepository(db);

/**
 * Returns the user's wallet, creating a zero-balance one if this is
 * their first visit to a wallet-displaying page. Safe to call on every
 * dashboard load — the repository's createForUser is idempotent.
 */
export async function getOrCreateWallet(userId: string): Promise<WalletRecord> {
  const existing = await walletRepository.findByUserId(userId);
  if (existing) return existing;
  return walletRepository.createForUser(userId);
}
