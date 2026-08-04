// File: packages/lib/src/index.ts
// Purpose: Public entry point for shared lightweight utilities, validation schemas, and types for @credixa/lib.

// Utilities & Validation
export { NIGERIAN_PHONE_REGEX } from "./validation/nigerian-phone";
export { formatKoboAsNaira } from "./currency/format-naira";

// Types - Provider Adapters & Routing
export type {
  VtuServiceType,
  PurchaseRequest,
  PurchaseOutcome,
  ProviderAdapter,
} from "./providers/types";
export { redactRequestForLogging } from "./providers/types";
export type {
  RoutedPurchaseAttempt,
  RoutePurchaseResult,
} from "./providers/provider-router";

// Types - VTU Service
export type {
  InitiatePurchaseInput,
  PurchaseResult,
  PurchaseResultStatus,
} from "./vtu/purchase-service";
export type { AwardCommissionResult } from "./commissions/commission-service";

// Types - Paystack & Payments
export type {
  InitializeTransactionInput,
  InitializeTransactionResult,
  VerifyTransactionResult,
} from "./payments/paystack-client";
export type {
  VerifyAndCreditResult,
  VerifyAndCreditStatus,
} from "./payments/verify-and-credit-payment";
