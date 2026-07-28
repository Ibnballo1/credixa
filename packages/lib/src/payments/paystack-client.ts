// File: packages/lib/src/payments/paystack-client.ts
// Purpose: Thin wrapper around the two Paystack endpoints this project
//          uses. Deliberately minimal — no SDK, since the full Paystack
//          Node SDK surface (transfers, subaccounts, plans, etc.) is far
//          more than Credixa needs right now, and a hand-rolled wrapper
//          keeps every field we depend on visible and typed in one place.
//
// API reference verified directly against paystack.com/docs before
// writing this (amounts in kobo/subunit; `response.data.status` is the
// TRANSACTION status — `response.status` is only whether the API call
// itself succeeded, a common source of bugs if conflated).

import { env } from "@credixa/config";

const PAYSTACK_BASE_URL = "https://api.paystack.co";

export class PaystackApiError extends Error {
  constructor(
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "PaystackApiError";
  }
}

interface PaystackEnvelope<T> {
  status: boolean;
  message: string;
  data: T;
}

async function paystackFetch<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`${PAYSTACK_BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });

  const body = (await response
    .json()
    .catch(() => null)) as PaystackEnvelope<T> | null;

  if (!response.ok || !body || body.status !== true) {
    throw new PaystackApiError(
      body?.message ??
        `Paystack request to ${path} failed with HTTP ${response.status}`,
      body,
    );
  }

  return body.data;
}

export interface InitializeTransactionInput {
  email: string;
  amountKobo: number;
  reference: string;
  callbackUrl: string;
  metadata?: Record<string, unknown>;
}

export interface InitializeTransactionResult {
  authorizationUrl: string;
  accessCode: string;
  reference: string;
}

export async function initializeTransaction(
  input: InitializeTransactionInput,
): Promise<InitializeTransactionResult> {
  const data = await paystackFetch<{
    authorization_url: string;
    access_code: string;
    reference: string;
  }>("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email: input.email,
      amount: input.amountKobo,
      reference: input.reference,
      currency: "NGN",
      callback_url: input.callbackUrl,
      metadata: input.metadata,
    }),
  });

  return {
    authorizationUrl: data.authorization_url,
    accessCode: data.access_code,
    reference: data.reference,
  };
}

export interface VerifyTransactionResult {
  /** Paystack's raw status string: "success" | "failed" | "abandoned" | others. */
  status: string;
  reference: string;
  amountKobo: number;
  currency: string;
  channel: string | null;
  paidAtIso: string | null;
  providerTransactionId: string | null;
  raw: unknown;
}

export async function verifyTransaction(
  reference: string,
): Promise<VerifyTransactionResult> {
  const data = await paystackFetch<{
    status: string;
    reference: string;
    amount: number;
    currency: string;
    channel: string | null;
    paid_at: string | null;
    id: number | string;
  }>(`/transaction/verify/${encodeURIComponent(reference)}`, {
    method: "GET",
  });

  return {
    status: data.status,
    reference: data.reference,
    amountKobo: data.amount,
    currency: data.currency,
    channel: data.channel,
    paidAtIso: data.paid_at,
    providerTransactionId: data.id != null ? String(data.id) : null,
    raw: data,
  };
}
