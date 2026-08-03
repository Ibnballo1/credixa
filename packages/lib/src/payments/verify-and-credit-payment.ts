// File: packages/lib/src/payments/verify-and-credit-payment.ts
// Purpose: The ONLY place a payment is ever confirmed and credited to a
//          wallet. Three callers converge here: the post-checkout
//          callback page, the Paystack webhook handler, and the
//          pending-payment-sweep recovery job. Each of them may call this
//          for the SAME payment — that's by design (Paystack's own docs
//          warn to guard against double-fulfillment when using both a
//          callback and webhooks) — and it's safe because:
//            1. This function re-verifies with Paystack's OWN API every
//               time, never trusting a caller's claim that a payment
//               succeeded (webhook payloads included).
//            2. The actual wallet credit goes through
//               packages/db/src/ledger's creditWallet with a
//               deterministic idempotency key derived from the payment's
//               reference — so even if two callers both reach the credit
//               step concurrently, only one credit is ever applied.
//            3. payment-repository's markSuccess/markFailed are
//               conditional on the row still being "initiated" — a
//               second caller's update is a safe no-op, not an error.

import {
  db,
  createPaymentRepository,
  // createReferralRepository,
  creditWallet,
  WalletFrozenError,
} from "@credixa/db";
import { verifyTransaction } from "./paystack-client";
// import { awardReferralCommission } from "../commissions/commission-service";

export type VerifyAndCreditStatus =
  | "success"
  | "failed"
  | "abandoned"
  | "pending"
  | "already_processed";

export interface VerifyAndCreditResult {
  status: VerifyAndCreditStatus;
  paymentId: string;
}

export async function verifyAndCreditPayment(
  reference: string,
): Promise<VerifyAndCreditResult> {
  const paymentRepository = createPaymentRepository(db);
  const paymentRow = await paymentRepository.findByReference(reference);

  if (!paymentRow) {
    throw new Error(
      `verifyAndCreditPayment: no payment found for reference ${reference}`,
    );
  }

  if (paymentRow.status !== "initiated") {
    return { status: "already_processed", paymentId: paymentRow.id };
  }

  const verification = await verifyTransaction(reference);

  // Paystack's `data.status` can be "success", genuinely terminal
  // negative states ("failed", "abandoned"), or transient in-progress
  // states ("pending", "ongoing", "queued", depending on channel). Only
  // the terminal negative states should ever mark this payment failed —
  // anything else must leave it as "initiated" so a later re-check (the
  // callback page on refresh, or the recovery sweep) can still resolve
  // it. Treating every non-"success" status as failure here was a real
  // bug caught before this shipped: it would have permanently killed a
  // payment that was simply still processing.
  if (verification.status === "failed" || verification.status === "abandoned") {
    await paymentRepository.markFailed(paymentRow.id, verification.status, {
      paystackStatus: verification.status,
      raw: verification.raw,
    });
    return { status: verification.status, paymentId: paymentRow.id };
  }

  if (verification.status !== "success") {
    // Transient — leave the payment row untouched.
    return { status: "pending", paymentId: paymentRow.id };
  }

  if (verification.amountKobo !== paymentRow.amountKobo) {
    // Never credit an amount different from what we initiated — this
    // would only happen from a corrupted/tampered reference or a
    // Paystack-side inconsistency, and either way guessing which figure
    // is "right" is not an option for a financial credit.
    await paymentRepository.markFailed(paymentRow.id, "failed", {
      reason: "amount_mismatch",
      expectedKobo: paymentRow.amountKobo,
      paystackAmountKobo: verification.amountKobo,
    });
    return { status: "failed", paymentId: paymentRow.id };
  }

  const creditResult = await creditWallet(db, {
    walletId: paymentRow.walletId,
    amountKobo: paymentRow.amountKobo,
    type: "funding",
    idempotencyKey: `funding:${paymentRow.reference}`,
    description: "Wallet funding via Paystack",
    metadata: { paymentId: paymentRow.id, paystackReference: reference },
    actorUserId: paymentRow.userId,
  }).catch((err) => {
    if (err instanceof WalletFrozenError) {
      // Paystack DID capture real money here — marking this payment
      // "failed" would be actively misleading (it implies no money
      // changed hands, prompting the customer to retry and pay twice).
      // Leave the payment "initiated" instead: once an admin unfreezes
      // the wallet, the next callback visit / webhook retry / sweep run
      // will successfully credit it. Reusing "pending" for the return
      // status here is a deliberate stretch of its usual meaning
      // ("provider hasn't settled yet") to cover "resolved on our side,
      // blocked by wallet state" — both cases share the same correct
      // caller behavior: don't tell the user it failed, try again later.
      return null;
    }
    throw err;
  });

  if (!creditResult) {
    return { status: "pending", paymentId: paymentRow.id };
  }

  const updated = await paymentRepository.markSuccess(paymentRow.id, {
    walletTransactionId: creditResult.transaction.id,
    channel: verification.channel,
    paidAt: verification.paidAtIso
      ? new Date(verification.paidAtIso)
      : new Date(),
    providerTransactionId: verification.providerTransactionId,
    metadata: { raw: verification.raw },
  });

  if (!updated) {
    // A concurrent caller (e.g. the webhook arriving mid-callback-verify)
    // already marked this payment successful first. The ledger credit
    // above was necessarily a no-op replay in that case (same
    // idempotency key), so no double credit occurred — this is just a
    // benign race over which caller's metadata update "wins."
    return { status: "already_processed", paymentId: paymentRow.id };
  }

  // Phase 7b: qualify a pending referral on this user's FIRST successful
  // funding — not on signup alone, so a referral only "counts" once the
  // referred user actually transacts. Best-effort: a failure here must
  // never fail the funding itself, since the money has already been
  // credited by this point.
  try {
    if (
      (await paymentRepository.countSuccessfulByUser(paymentRow.userId)) === 1
    ) {
      // const referralRepository = createReferralRepository(db);
      // const qualified = await referralRepository.qualifyIfPending(
      //   paymentRow.userId,
      // );
      // Phase 7c: award the referrer's commission the moment (and only
      // the moment) qualification actually happened here — not on every
      // funding, and not if the referral was already qualified by a
      // concurrent caller (qualifyIfPending returns null in that case).
      // if (qualified) {
      //   await awardReferralCommission(qualified.id);
      // }
    }
  } catch {
    // Swallow — referral qualification/commissioning is a growth-tracking
    // side effect, not part of the financial guarantee this function
    // exists to make for the funding itself.
  }

  return { status: "success", paymentId: paymentRow.id };
}
