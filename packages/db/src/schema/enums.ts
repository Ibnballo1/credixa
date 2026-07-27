// File: packages/db/src/schema/enums.ts
// Purpose: Postgres enums used across the schema. Defined once here so a
//          value can never drift between tables that reference the same
//          concept.

import { pgEnum } from "drizzle-orm/pg-core";
import { CREDIXA_ROLES } from "@credixa/types";

// Mirrors @credixa/types CREDIXA_ROLES exactly — imported, not re-typed,
// so the DB enum and the application-level type can never fall out of sync.
export const roleEnum = pgEnum("credixa_role", CREDIXA_ROLES);

export const kycStatusEnum = pgEnum("credixa_kyc_status", [
  "unverified",
  "pending",
  "verified",
  "rejected",
]);
