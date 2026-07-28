// File: packages/lib/src/payments/verify-webhook-signature.ts
// Purpose: Verifies the `x-paystack-signature` header. Paystack signs
//          webhooks with HMAC-SHA512 of the RAW request body, keyed with
//          the same secret key used for API calls — there is no separate
//          webhook secret (verified against Paystack's docs before
//          implementing this; see the note on PAYSTACK_SECRET_KEY in
//          packages/config/src/env.ts).
//
// CRITICAL: the caller MUST pass the raw request body string (e.g. from
// `await request.text()` in the Next.js route handler), never a
// re-serialized `JSON.stringify(parsedBody)` — Paystack's signature is
// computed over the exact bytes they sent, and re-stringifying a parsed
// object can produce a different byte sequence (key order, whitespace)
// that will never match, or worse, coincidentally match something it
// shouldn't in some malformed-input edge case. Parse the body AFTER
// verifying, not before.

import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@credixa/config";

export function verifyPaystackWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
): boolean {
  if (!signatureHeader) return false;

  const expected = createHmac("sha512", env.PAYSTACK_SECRET_KEY)
    .update(rawBody)
    .digest("hex");

  const expectedBuffer = Buffer.from(expected, "utf8");
  const providedBuffer = Buffer.from(signatureHeader, "utf8");

  // timingSafeEqual throws on mismatched lengths rather than returning
  // false, so guard explicitly — a length mismatch simply means "not a
  // match," not an error condition.
  if (expectedBuffer.length !== providedBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, providedBuffer);
}
