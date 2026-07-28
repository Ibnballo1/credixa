// File: packages/lib/src/index.ts
// Purpose: Public entry point for client-safe utilities in @credixa/lib.

export { NIGERIAN_PHONE_REGEX } from "./validation/nigerian-phone";
export { formatKoboAsNaira } from "./currency/format-naira";

// Types are erased at compile time, so they are 100% safe to export here too:
export type {
  InitializeTransactionInput,
  InitializeTransactionResult,
  VerifyTransactionResult,
} from "./payments/paystack-client";

export type {
  VerifyAndCreditResult,
  VerifyAndCreditStatus,
} from "./payments/verify-and-credit-payment";
