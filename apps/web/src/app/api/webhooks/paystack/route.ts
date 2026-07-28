/**
 * File: apps/web/src/app/api/webhooks/paystack/route.ts
 * Purpose: Receives Paystack webhooks. Every request is logged to
 *          `payment_webhook` BEFORE the signature check even runs, so a
 *          spoofed/invalid request is still visible for security review.
 *          Only a valid `charge.success` event triggers
 *          verifyAndCreditPayment — which re-verifies with Paystack's own
 *          API rather than trusting this payload's contents, per
 *          "Never trust frontend/webhook payment responses" (a webhook
 *          body is attacker-shaped input even when its signature is
 *          genuine — the signature only proves it came from Paystack,
 *          not that the specific fields inside are what should drive a
 *          credit decision).
 *
 * This route handler stays thin by design — all real logic is in
 * @credixa/lib's verifyPaystackWebhookSignature and
 * verifyAndCreditPayment.
 */
import { NextResponse, type NextRequest } from "next/server";
import { db, createPaymentWebhookRepository } from "@credixa/db";
import {
  verifyPaystackWebhookSignature,
  verifyAndCreditPayment,
} from "@credixa/lib/jobs";

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signatureHeader = request.headers.get("x-paystack-signature");
  const signatureValid = verifyPaystackWebhookSignature(
    rawBody,
    signatureHeader,
  );

  let parsedBody: { event?: string; data?: { reference?: string } } | null =
    null;
  try {
    parsedBody = JSON.parse(rawBody);
  } catch {
    parsedBody = null;
  }

  const webhookRepository = createPaymentWebhookRepository(db);
  const webhookLog = await webhookRepository.log({
    provider: "paystack",
    eventType: parsedBody?.event ?? "unknown",
    reference: parsedBody?.data?.reference ?? null,
    rawPayload: parsedBody ?? rawBody,
    signatureValid,
  });

  if (!signatureValid) {
    // Logged above for security review. Do not process further.
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (parsedBody?.event !== "charge.success") {
    await webhookRepository.markProcessed(webhookLog.id);
    return NextResponse.json({ received: true });
  }

  const reference = parsedBody.data?.reference;
  if (!reference) {
    await webhookRepository.markProcessingError(
      webhookLog.id,
      "charge.success event missing data.reference",
    );
    return NextResponse.json({ received: true });
  }

  try {
    await verifyAndCreditPayment(reference);
    await webhookRepository.markProcessed(webhookLog.id);
    return NextResponse.json({ received: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await webhookRepository.markProcessingError(webhookLog.id, message);

    if (message.includes("no payment found")) {
      // Not retryable — this reference will never resolve regardless of
      // how many times Paystack retries delivery.
      return NextResponse.json({ received: true });
    }

    // Unknown/transient failure (e.g. DB momentarily unavailable) — a
    // non-2xx response makes Paystack retry delivery per its own
    // schedule (every 3 min for 4 attempts, then hourly for 72h), which
    // gives this a real chance to self-heal.
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
