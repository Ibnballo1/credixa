// File: apps/admin/src/features/vtu/services/vtu-admin-service.ts
// Purpose: Platform-wide VTU purchase monitoring for Phase 6b.

import { db, createVtuPurchaseRepository } from "@credixa/db";
import type { VtuPurchaseRecord, VtuPurchaseWithDetails } from "@credixa/db";

export interface ListPurchasesParams {
  status?: VtuPurchaseRecord["status"];
  limit?: number;
  offset?: number;
}

export interface ListPurchasesResult {
  purchases: VtuPurchaseWithDetails[];
  total: number;
}

export async function listAllPurchases(
  params: ListPurchasesParams,
): Promise<ListPurchasesResult> {
  const vtuPurchaseRepository = createVtuPurchaseRepository(db);
  return vtuPurchaseRepository.listAllWithDetails(params);
}
