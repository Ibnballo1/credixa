// File: apps/admin/src/features/referrals/services/referral-admin-service.ts
// Purpose: Platform-wide referral monitoring for Phase 7b.

import { db, createReferralRepository } from "@credixa/db";
import type { ReferralWithBothUsers } from "@credixa/db";

export async function listAllReferrals(): Promise<ReferralWithBothUsers[]> {
  const referralRepository = createReferralRepository(db);
  return referralRepository.listAllWithDetails();
}
