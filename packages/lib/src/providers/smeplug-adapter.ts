// File: packages/lib/src/providers/smeplug-adapter.ts
// Purpose: Adapter for SMEPlug (smeplug.ng) with local dev mock fallback support.

import { env } from "@credixa/config";
import type {
  ProviderAdapter,
  PurchaseRequest,
  PurchaseOutcome,
  VtuServiceType,
} from "./types";

const BASE_URL = "https://smeplug.ng/api/v1";

/**
 * Checks if the configured SMEPlug API key is a dummy/placeholder key.
 */
function isDummyKey(key: string | undefined): boolean {
  if (!key) return true;
  const k = key.trim().toLowerCase();
  return (
    k === "fdsgdfg" ||
    k === "dummy" ||
    k === "test" ||
    k === "mock" ||
    k.startsWith("xxx") ||
    k.length < 10
  );
}

interface SmePlugTransactionEnvelope {
  transaction?: {
    status?: string;
    reference?: string;
    response?: string;
  };
  message?: string;
}

async function smePlugRequest(
  path: string,
  body: Record<string, unknown>,
): Promise<unknown> {
  const apiKey = env.SMEPLUG_API_KEY;

  // Dev Mock Interceptor: Bypass network call if key is dummy/invalid
  if (process.env.NODE_ENV !== "production" && isDummyKey(apiKey)) {
    console.warn(
      `[SMEPlug Adapter] Dummy API key detected ("${apiKey}"). Returning MOCK success response for ${path}.`,
    );
    return {
      transaction: {
        status: "success",
        reference: `mock-smeplug-ref-${Date.now()}`,
        response: "Mock transaction completed successfully",
      },
    };
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  return response.json();
}

function toOutcome(raw: unknown): PurchaseOutcome {
  const body = raw as SmePlugTransactionEnvelope;
  const status = body.transaction?.status?.toLowerCase();

  if (status === "success") {
    return {
      status: "success",
      providerReference: body.transaction?.reference ?? null,
      raw,
    };
  }
  if (status === "pending" || status === "processing") {
    return {
      status: "pending",
      providerReference: body.transaction?.reference ?? null,
      raw,
    };
  }
  return {
    status: "failed",
    reason:
      body.transaction?.response ?? body.message ?? "Unknown SMEPlug error",
    raw,
  };
}

export const smePlugAdapter: ProviderAdapter = {
  providerName: "smeplug",

  supports(type: VtuServiceType): boolean {
    return type === "airtime" || type === "data";
  },

  async purchase(request: PurchaseRequest): Promise<PurchaseOutcome> {
    if (request.type === "airtime") {
      const raw = await smePlugRequest("/airtime/purchase", {
        network: request.network.toLowerCase(),
        phone: request.recipientPhone,
        amount: Math.round(request.amountKobo / 100),
        reference: request.requestReference,
      });
      return toOutcome(raw);
    }

    if (request.type === "data") {
      const raw = await smePlugRequest("/data/purchase", {
        network: request.network.toLowerCase(),
        phone: request.recipientPhone,
        plan: request.providerPlanCode,
        reference: request.requestReference,
      });
      return toOutcome(raw);
    }

    return {
      status: "failed",
      reason: `SMEPlug adapter does not support ${request.type}`,
      raw: null,
    };
  },

  async checkStatus(providerReference: string): Promise<PurchaseOutcome> {
    const apiKey = env.SMEPLUG_API_KEY;

    // Dev Mock Interceptor for status checks
    if (process.env.NODE_ENV !== "production" && isDummyKey(apiKey)) {
      return toOutcome({
        transaction: {
          status: "success",
          reference: providerReference,
          response: "Mock checkStatus completed successfully",
        },
      });
    }

    const response = await fetch(
      `${BASE_URL}/transactions/${encodeURIComponent(providerReference)}`,
      { headers: { Authorization: `Bearer ${apiKey}` } },
    );
    const raw = await response.json();
    return toOutcome(raw);
  },
};
