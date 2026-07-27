// File: packages/db/src/index.ts
// Purpose: Public entry point for @credixa/db.

export { db } from "./client";
export type { Database } from "./client";
export * as schema from "./schema";
export { createUserRepository } from "./repositories/user-repository";
export type {
  UserRepository,
  UserRecord,
} from "./repositories/user-repository";
