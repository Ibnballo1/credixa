// File: packages/lib/src/providers/clubkonnect-adapter.ts
// Purpose: Adapter for ClubKonnect (nellobytesystems.com) with local dev mock fallback support.

import { env } from "@credixa/config";
import type {
  ProviderAdapter,
  PurchaseRequest,
  PurchaseOutcome,
  VtuServiceType,
} from "./types";

const BASE_URL = "https://www.nellobytesystems.com";

// UNVERIFIED — confirm against the signed-in ClubKonnect dashboard.
const NETWORK_CODES: Record<string, string> = {
  MTN: "01",
  GLO: "02",
  AIRTEL: "03",
  "9MOBILE": "04",
};

/**
 * Checks if the configured ClubKonnect API credentials are dummy/placeholder values.
 */
function isDummyCreds(
  userId: string | undefined,
  apiKey: string | undefined,
): boolean {
  if (!userId || !apiKey) return true;
  const uid = userId.trim().toLowerCase();
  const key = apiKey.trim().toLowerCase();
  return (
    uid === "dgfxgf" ||
    key === "dgfgdfg" ||
    uid === "dummy" ||
    key === "dummy" ||
    uid === "test" ||
    key === "test" ||
    key.length < 8
  );
}

function interpretStatus(
  status: string | undefined,
): "success" | "pending" | "failed" {
  const normalized = (status ?? "").toUpperCase();
  if (
    normalized === "ORDER_COMPLETED" ||
    normalized === "TRANSACTION_COMPLETED"
  )
    return "success";
  if (normalized === "ORDER_RECEIVED" || normalized === "ORDER_ONHOLD")
    return "pending";
  return "failed";
}

async function nellobyteGet(
  path: string,
  params: Record<string, string | undefined>,
): Promise<unknown> {
  const userId = env.CLUBKONNECT_USER_ID;
  const apiKey = env.CLUBKONNECT_API_KEY;

  // Dev Mock Interceptor: Bypass network call if credentials are dummy values
  if (process.env.NODE_ENV !== "production" && isDummyCreds(userId, apiKey)) {
    console.warn(
      `[ClubKonnect Adapter] Dummy credentials detected. Returning MOCK success response for ${path}.`,
    );
    return {
      status: "ORDER_COMPLETED",
      orderid: `mock-ck-ref-${Date.now()}`,
      msg: "Mock transaction completed successfully",
    };
  }

  const url = new URL(path, BASE_URL);
  url.searchParams.set("UserID", userId);
  url.searchParams.set("APIKey", apiKey);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) url.searchParams.set(key, value);
  }

  const response = await fetch(url.toString(), { method: "GET" });
  return response.json();
}

function toOutcome(raw: unknown): PurchaseOutcome {
  const body = raw as { status?: string; orderid?: string };
  const interpreted = interpretStatus(body.status);

  if (interpreted === "success") {
    return { status: "success", providerReference: body.orderid ?? null, raw };
  }
  if (interpreted === "pending") {
    return { status: "pending", providerReference: body.orderid ?? null, raw };
  }
  return {
    status: "failed",
    reason: body.status ?? "Unknown ClubKonnect error",
    raw,
  };
}

export const clubKonnectAdapter: ProviderAdapter = {
  providerName: "clubkonnect",

  supports(type: VtuServiceType): boolean {
    // Electricity/cable deliberately excluded pending verification
    return type === "airtime" || type === "data";
  },

  async purchase(request: PurchaseRequest): Promise<PurchaseOutcome> {
    const networkCode = NETWORK_CODES[request.network.toUpperCase()];
    if (!networkCode) {
      return {
        status: "failed",
        reason: `Unknown network for ClubKonnect: ${request.network}`,
        raw: null,
      };
    }

    if (request.type === "airtime") {
      const raw = await nellobyteGet("/APIAirtimeV1.asp", {
        MobileNetwork: networkCode,
        Amount: String(Math.round(request.amountKobo / 100)),
        MobileNumber: request.recipientPhone,
        RequestID: request.requestReference,
      });
      return toOutcome(raw);
    }

    if (request.type === "data") {
      const raw = await nellobyteGet("/APIDatabundleV1.asp", {
        MobileNetwork: networkCode,
        DataPlan: request.providerPlanCode,
        MobileNumber: request.recipientPhone,
        RequestID: request.requestReference,
      });
      return toOutcome(raw);
    }

    return {
      status: "failed",
      reason: `ClubKonnect adapter does not support ${request.type} (unverified — see header comment)`,
      raw: null,
    };
  },

  async checkStatus(providerReference: string): Promise<PurchaseOutcome> {
    const userId = env.CLUBKONNECT_USER_ID;
    const apiKey = env.CLUBKONNECT_API_KEY;

    // Dev Mock Interceptor for status checks
    if (process.env.NODE_ENV !== "production" && isDummyCreds(userId, apiKey)) {
      return toOutcome({
        status: "ORDER_COMPLETED",
        orderid: providerReference,
      });
    }

    const raw = await nellobyteGet("/APIQuery.asp", {
      OrderID: providerReference,
    });
    return toOutcome(raw);
  },
};
