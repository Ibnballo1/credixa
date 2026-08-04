// File: apps/web/src/features/earnings/services/earnings-service.ts
// Purpose: Read-side query for the customer's own commission history
//          (referral bonuses + agent margin, if applicable).

import { db, createCommissionRepository } from "@credixa/db";
import type { CommissionRecord } from "@credixa/db";

export interface MyEarningsData {
  commissions: CommissionRecord[];
  totalPaidKobo: number;
}

export async function getMyEarnings(userId: string): Promise<MyEarningsData> {
  const commissionRepository = createCommissionRepository(db);
  const commissions = await commissionRepository.listByUser(userId);
  const totalPaidKobo = commissions
    .filter((c) => c.status === "paid")
    .reduce((sum, c) => sum + c.amountKobo, 0);

  return { commissions, totalPaidKobo };
}
