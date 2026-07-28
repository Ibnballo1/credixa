// File: apps/web/src/features/payments/services/funding-service.ts
// Purpose: The customer-app-specific half of funding — initiating a
//          payment. The other half (verifying and crediting) is shared
//          across apps/web and the background sweep, so it lives in
//          @credixa/lib instead (see verify-and-credit-payment.ts there).

import {
  db,
  createPaymentRepository,
  createWalletRepository,
  generateReference,
  type PaymentRecord,
} from "@credixa/db";
import { initializeTransaction } from "@credixa/lib/jobs";

export interface InitiateFundingInput {
  userId: string;
  userEmail: string;
  amountNaira: number;
}

export interface InitiateFundingResult {
  authorizationUrl: string;
  reference: string;
}

export async function initiateFunding(
  input: InitiateFundingInput,
): Promise<InitiateFundingResult> {
  const walletRepository = createWalletRepository(db);
  const paymentRepository = createPaymentRepository(db);

  const wallet = await walletRepository.createForUser(input.userId);
  const amountKobo = input.amountNaira * 100;
  const reference = generateReference("FUND");

  const paymentRow = await paymentRepository.create({
    userId: input.userId,
    walletId: wallet.id,
    reference,
    amountKobo,
  });

  const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/fund/callback`;

  try {
    const { authorizationUrl } = await initializeTransaction({
      email: input.userEmail,
      amountKobo,
      reference,
      callbackUrl,
    });

    return { authorizationUrl, reference };
  } catch (err) {
    // Paystack never accepted this reference — it will never appear in
    // a webhook or a verify call, so this payment can never resolve on
    // its own. Mark it failed immediately rather than leaving an
    // "initiated" row the recovery sweep would spin on forever.
    await paymentRepository.markFailed(paymentRow.id, "failed", {
      reason: "paystack_initialize_failed",
      error: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }
}

/**
 * Fetches a payment ONLY if it belongs to `userId` — used by the
 * callback page so one user can't probe another user's payment
 * reference via the callback URL and learn anything about it.
 */
export async function getPaymentForUser(
  reference: string,
  userId: string,
): Promise<PaymentRecord | null> {
  const paymentRepository = createPaymentRepository(db);
  const paymentRow = await paymentRepository.findByReference(reference);
  if (!paymentRow || paymentRow.userId !== userId) {
    return null;
  }
  return paymentRow;
}
