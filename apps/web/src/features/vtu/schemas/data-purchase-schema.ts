// File: apps/web/src/features/vtu/schemas/data-purchase-schema.ts
// Purpose: Validation for data bundle purchases. No amount field here —
//          the price is fixed per plan (`service.priceKobo`) and MUST be
//          read server-side from that record, never trusted from the
//          client, so a tampered form submission can't request a plan at
//          an attacker-chosen price.

import { z } from "zod";
import { NIGERIAN_PHONE_REGEX } from "@credixa/lib";

export const dataPurchaseSchema = z.object({
  serviceId: z.string().uuid(),
  recipientPhone: z
    .string()
    .trim()
    .regex(NIGERIAN_PHONE_REGEX, "Enter a valid Nigerian phone number"),
});

export type DataPurchaseInput = z.infer<typeof dataPurchaseSchema>;
