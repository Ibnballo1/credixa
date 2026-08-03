// File: apps/web/src/features/referrals/services/referral-service.ts
// Purpose: Read-side queries for the customer referrals page. The
//          referral code is lazily created here (getOrCreate) — no
//          backfill needed for users who signed up before Phase 7b.

import {
  db,
  createReferralCodeRepository,
  createReferralRepository,
} from "@credixa/db";
import type { ReferralCodeRecord, ReferralWithReferredUser } from "@credixa/db";

export interface MyReferralsData {
  code: ReferralCodeRecord;
  referrals: ReferralWithReferredUser[];
}

export async function getMyReferrals(userId: string): Promise<MyReferralsData> {
  const referralCodeRepository = createReferralCodeRepository(db);
  const referralRepository = createReferralRepository(db);

  const [code, referrals] = await Promise.all([
    referralCodeRepository.getOrCreate(userId),
    referralRepository.listByReferrer(userId),
  ]);

  return { code, referrals };
}
