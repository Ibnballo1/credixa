// File: apps/web/src/features/vtu/services/vtu-catalog-service.ts
// Purpose: Read-side catalog queries backing the purchase forms.

import { db, createServiceRepository } from "@credixa/db";
import type { ServiceRecord } from "@credixa/db";

export async function getAirtimeNetworks(): Promise<ServiceRecord[]> {
  return createServiceRepository(db).listByType("airtime");
}

export async function getDataPlans(): Promise<ServiceRecord[]> {
  return createServiceRepository(db).listByType("data");
}
