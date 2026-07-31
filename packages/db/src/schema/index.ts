// File: packages/db/src/schema/index.ts
// Purpose: Barrel export of every table/enum. This is what's passed as
//          `schema` to both drizzle() and Better Auth's drizzleAdapter, so
//          the ORM and the auth layer always agree on table shape.

export * from "./enums";
export * from "./auth";
export * from "./wallet";
export * from "./notification";
export * from "./ledger";
export * from "./payment";
export * from "./vtu";
export * from "./pricing";
export * from "./agent";
