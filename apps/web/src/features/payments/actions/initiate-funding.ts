// File: apps/web/src/features/payments/actions/initiate-funding.ts
// Purpose: Server Action backing the "Fund Wallet" form. Validates the
//          amount, initiates the payment, and redirects to Paystack's
//          hosted checkout — the wallet is NOT credited here or anywhere
//          in this file. Crediting only ever happens in
//          verifyAndCreditPayment (@credixa/lib), triggered later by the
//          callback page, the webhook, or the recovery sweep.

"use server";

import { redirect } from "next/navigation";
import { requireAuth } from "@credixa/auth";
import {
  fundWalletSchema,
  type FundWalletInput,
} from "../schemas/fund-wallet-schema";
import { initiateFunding } from "../services/funding-service";
import { PaystackApiError } from "@credixa/lib/jobs";

export type InitiateFundingActionResult =
  | { success: true }
  | { success: false; error: string };

export async function initiateFundingAction(
  input: FundWalletInput,
): Promise<InitiateFundingActionResult> {
  const session = await requireAuth();

  const parsed = fundWalletSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Enter a valid amount",
    };
  }

  let authorizationUrl: string;
  try {
    const result = await initiateFunding({
      userId: session.user.id,
      userEmail: session.user.email,
      amountNaira: parsed.data.amountNaira,
    });
    authorizationUrl = result.authorizationUrl;
  } catch (err: unknown) {
    console.error(err);

    if (err instanceof PaystackApiError) {
      return {
        success: false,
        error: err.message,
      };
    }

    if (err instanceof Error) {
      return {
        success: false,
        error: err.message,
      };
    }

    return {
      success: false,
      error: "Unknown error",
    };
  }

  redirect(authorizationUrl);
}
