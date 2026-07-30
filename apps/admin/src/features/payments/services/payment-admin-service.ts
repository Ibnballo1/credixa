// File: apps/admin/src/features/payments/services/payment-admin-service.ts
// Purpose: Platform-wide payment (funding) monitoring for Phase 6b.

import { db, createPaymentRepository } from "@credixa/db";
import type { PaymentRecord, PaymentWithUser } from "@credixa/db";

export interface ListPaymentsParams {
  status?: PaymentRecord["status"];
  limit?: number;
  offset?: number;
}

export interface ListPaymentsResult {
  payments: PaymentWithUser[];
  total: number;
}

export async function listAllPayments(
  params: ListPaymentsParams,
): Promise<ListPaymentsResult> {
  const paymentRepository = createPaymentRepository(db);
  return paymentRepository.listAllWithUser(params);
}
