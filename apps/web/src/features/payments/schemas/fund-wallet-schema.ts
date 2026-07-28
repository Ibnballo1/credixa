// File: apps/web/src/features/payments/schemas/fund-wallet-schema.ts
// Purpose: Validation for the wallet-funding amount. Bounds are a
//          starting point (₦100 min, ₦1,000,000 max per transaction) —
//          revisit once real usage patterns and Paystack's own channel
//          limits (card vs. bank transfer) are better understood.

import { z } from "zod";

const MIN_NAIRA = 100;
const MAX_NAIRA = 1_000_000;

export const fundWalletSchema = z.object({
  amountNaira: z.coerce
    .number()
    .int("Enter a whole Naira amount")
    .min(
      MIN_NAIRA,
      `Minimum funding amount is ₦${MIN_NAIRA.toLocaleString("en-NG")}`,
    )
    .max(
      MAX_NAIRA,
      `Maximum funding amount is ₦${MAX_NAIRA.toLocaleString("en-NG")} per transaction`,
    ),
});

export type FundWalletInput = z.infer<typeof fundWalletSchema>;
