// File: apps/web/src/features/vtu/actions/purchase-airtime.ts
// Purpose: Server Action for airtime purchases. Validates input, then
//          delegates entirely to initiatePurchase (@credixa/lib) — this
//          file has no business logic of its own, matching the rule
//          that business logic never lives in components or thin action
//          wrappers.

"use server";

import { requireAuth } from "@credixa/auth";
import {
  db,
  createWalletRepository,
  InsufficientBalanceError,
  WalletFrozenError,
} from "@credixa/db";
import { initiatePurchase } from "@credixa/lib/jobs";
import {
  airtimePurchaseSchema,
  type AirtimePurchaseInput,
} from "../schemas/airtime-purchase-schema";

export type PurchaseActionResult =
  | { success: true; status: "success" | "pending" }
  | { success: false; error: string };

export async function purchaseAirtimeAction(
  input: AirtimePurchaseInput & { idempotencyKey: string },
): Promise<PurchaseActionResult> {
  const session = await requireAuth();

  const parsed = airtimePurchaseSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  const walletRepository = createWalletRepository(db);
  const wallet = await walletRepository.createForUser(session.user.id);

  try {
    const result = await initiatePurchase({
      userId: session.user.id,
      walletId: wallet.id,
      serviceId: parsed.data.serviceId,
      amountKobo: parsed.data.amountNaira * 100,
      idempotencyKey: input.idempotencyKey,
      recipientPhone: parsed.data.recipientPhone,
    });

    if (result.status === "failed") {
      return {
        success: false,
        error: result.reason ?? "Purchase failed. Please try again.",
      };
    }

    return { success: true, status: result.status };
  } catch (err) {
    if (err instanceof InsufficientBalanceError) {
      return {
        success: false,
        error:
          "Insufficient wallet balance. Please fund your wallet and try again.",
      };
    }
    if (err instanceof WalletFrozenError) {
      return {
        success: false,
        error: "Your wallet is currently frozen. Please contact support.",
      };
    }
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
