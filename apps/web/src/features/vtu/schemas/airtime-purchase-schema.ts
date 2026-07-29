// File: apps/web/src/features/vtu/schemas/airtime-purchase-schema.ts
// Purpose: Validation for airtime purchases. Amount is user-entered
//          (unlike data/cable plans, airtime has no fixed catalog price).

import { z } from "zod";
import { NIGERIAN_PHONE_REGEX } from "@credixa/lib";

const MIN_NAIRA = 50;
const MAX_NAIRA = 50_000;

export const airtimePurchaseSchema = z.object({
  serviceId: z.string().uuid(),
  recipientPhone: z
    .string()
    .trim()
    .regex(NIGERIAN_PHONE_REGEX, "Enter a valid Nigerian phone number"),
  amountNaira: z.coerce
    .number()
    .int("Enter a whole Naira amount")
    .min(MIN_NAIRA, `Minimum airtime purchase is ₦${MIN_NAIRA}`)
    .max(
      MAX_NAIRA,
      `Maximum airtime purchase is ₦${MAX_NAIRA.toLocaleString("en-NG")}`,
    ),
});

export type AirtimePurchaseInput = z.infer<typeof airtimePurchaseSchema>;
