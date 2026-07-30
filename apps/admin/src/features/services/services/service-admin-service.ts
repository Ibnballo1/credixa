// File: apps/admin/src/features/services/services/service-admin-service.ts
// Purpose: Read-side queries for the admin service configuration area.

import {
  db,
  createProviderRepository,
  createServiceRepository,
} from "@credixa/db";
import type { ProviderRecord, ServiceRecord } from "@credixa/db";

export async function listAllProviders(): Promise<ProviderRecord[]> {
  return createProviderRepository(db).listAll();
}

export async function listAllServices(): Promise<ServiceRecord[]> {
  return createServiceRepository(db).listAll();
}
