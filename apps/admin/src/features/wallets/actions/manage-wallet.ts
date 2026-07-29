// File: apps/admin/src/features/wallets/actions/manage-wallet.ts
// Purpose: Server Actions for admin wallet management. `adjustBalanceAction`
//          is the first real, production caller of creditWallet/debitWallet
//          with type "adjustment" — everywhere else those functions have
//          only been exercised by tooling/scripts/wallet-ledger-demo.ts.
//          Every action here requires admin role and writes an audit_log
//          row (creditWallet/debitWallet already write one per Phase 3's
//          own design, but the freeze/unfreeze actions below need their
//          own explicit entry since setStatus isn't part of the ledger).

"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@credixa/auth";
import {
  db,
  createWalletRepository,
  createAuditLogRepository,
  creditWallet,
  debitWallet,
  InsufficientBalanceError,
  WalletFrozenError,
} from "@credixa/db";

export type WalletActionResult =
  | { success: true }
  | { success: false; error: string };

export interface AdjustBalanceInput {
  walletId: string;
  direction: "credit" | "debit";
  amountNaira: number;
  reason: string;
  idempotencyKey: string;
}

export async function adjustBalanceAction(
  input: AdjustBalanceInput,
): Promise<WalletActionResult> {
  const session = await requireRole("admin");

  if (!input.reason.trim()) {
    return {
      success: false,
      error: "A reason is required for manual adjustments.",
    };
  }
  if (!Number.isInteger(input.amountNaira) || input.amountNaira <= 0) {
    return { success: false, error: "Enter a whole, positive Naira amount." };
  }

  const amountKobo = input.amountNaira * 100;

  try {
    if (input.direction === "credit") {
      await creditWallet(db, {
        walletId: input.walletId,
        amountKobo,
        type: "adjustment",
        idempotencyKey: input.idempotencyKey,
        description: `Admin adjustment: ${input.reason}`,
        actorUserId: session.user.id,
      });
    } else {
      await debitWallet(db, {
        walletId: input.walletId,
        amountKobo,
        type: "adjustment",
        idempotencyKey: input.idempotencyKey,
        description: `Admin adjustment: ${input.reason}`,
        actorUserId: session.user.id,
      });
    }
  } catch (err) {
    if (err instanceof InsufficientBalanceError) {
      return {
        success: false,
        error: "This debit would take the wallet below zero.",
      };
    }
    if (err instanceof WalletFrozenError) {
      return {
        success: false,
        error: "This wallet is frozen — unfreeze it before adjusting.",
      };
    }
    return { success: false, error: "Adjustment failed. Please try again." };
  }

  revalidatePath(`/dashboard/wallets/${input.walletId}`);
  return { success: true };
}

export async function freezeWalletAction(
  walletId: string,
  reason: string,
): Promise<WalletActionResult> {
  const session = await requireRole("admin");

  const walletRepository = createWalletRepository(db);
  const updated = await walletRepository.setStatus(walletId, "frozen");
  if (!updated) {
    return { success: false, error: "Wallet not found." };
  }

  const auditLogRepository = createAuditLogRepository(db);
  await auditLogRepository.create({
    actorUserId: session.user.id,
    action: "admin.wallet.freeze",
    entityType: "wallet",
    entityId: walletId,
    metadata: { reason },
  });

  revalidatePath(`/dashboard/wallets/${walletId}`);
  return { success: true };
}

export async function unfreezeWalletAction(
  walletId: string,
): Promise<WalletActionResult> {
  const session = await requireRole("admin");

  const walletRepository = createWalletRepository(db);
  const updated = await walletRepository.setStatus(walletId, "active");
  if (!updated) {
    return { success: false, error: "Wallet not found." };
  }

  const auditLogRepository = createAuditLogRepository(db);
  await auditLogRepository.create({
    actorUserId: session.user.id,
    action: "admin.wallet.unfreeze",
    entityType: "wallet",
    entityId: walletId,
  });

  revalidatePath(`/dashboard/wallets/${walletId}`);
  return { success: true };
}
