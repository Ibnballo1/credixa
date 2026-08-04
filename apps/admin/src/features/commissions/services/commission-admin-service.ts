// File: apps/admin/src/features/commissions/services/commission-admin-service.ts
// Purpose: Platform-wide commission monitoring for Phase 7c.

import { db, createCommissionRepository } from "@credixa/db";
import type { CommissionRecord, CommissionWithUser } from "@credixa/db";

export interface ListCommissionsParams {
  status?: CommissionRecord["status"];
  limit?: number;
  offset?: number;
}

export interface ListCommissionsResult {
  commissions: CommissionWithUser[];
  total: number;
}

export async function listAllCommissions(
  params: ListCommissionsParams,
): Promise<ListCommissionsResult> {
  const commissionRepository = createCommissionRepository(db);
  return commissionRepository.listAllWithUser(params);
}
