// File: apps/web/src/features/vtu/actions/purchase-data.ts
// Purpose: Server Action for data bundle purchases.

"use server";

import { requireAuth } from "@credixa/auth";
import {
  db,
  createWalletRepository,
  createServiceRepository,
  InsufficientBalanceError,
  WalletFrozenError,
} from "@credixa/db";
import { initiatePurchase } from "@credixa/lib/jobs";
import {
  dataPurchaseSchema,
  type DataPurchaseInput,
} from "../schemas/data-purchase-schema";
import type { PurchaseActionResult } from "./purchase-airtime";

export async function purchaseDataAction(
  input: DataPurchaseInput & { idempotencyKey: string },
): Promise<PurchaseActionResult> {
  const session = await requireAuth();

  const parsed = dataPurchaseSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  const serviceRepository = createServiceRepository(db);
  const serviceRow = await serviceRepository.findById(parsed.data.serviceId);
  if (
    !serviceRow ||
    serviceRow.type !== "data" ||
    serviceRow.priceKobo == null
  ) {
    return { success: false, error: "This data plan is no longer available." };
  }

  const walletRepository = createWalletRepository(db);
  const wallet = await walletRepository.createForUser(session.user.id);

  try {
    const result = await initiatePurchase({
      userId: session.user.id,
      walletId: wallet.id,
      serviceId: serviceRow.id,
      // Authoritative price from the catalog row — never the client's.
      amountKobo: serviceRow.priceKobo,
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
