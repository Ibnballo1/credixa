// File: tooling/scripts/seed-vtu-catalog.ts
// Purpose: Populates `provider` and `service` — both empty by default,
//          and purchases can't work at all without them. Run with:
//              pnpm exec tsx tooling/scripts/seed-vtu-catalog.ts
//
// The data plan entries below are ILLUSTRATIVE placeholders, not synced
// from either provider's real catalog — `providerPlanCode` values are
// made up and WILL be rejected by the real provider APIs. Replace them
// with real plan codes pulled from SMEPlug's /data/plans endpoint (or
// ClubKonnect's equivalent, once confirmed) before relying on data
// purchases end to end. Airtime rows need no plan code and work as soon
// as the provider capability flags below match reality.

import { db, provider, service } from "@credixa/db";

async function main() {
  console.log("Seeding providers...");

  await db
    .insert(provider)
    .values([
      {
        name: "clubkonnect",
        displayName: "ClubKonnect",
        priority: 100,
        supportsAirtime: true,
        supportsData: true,
        supportsElectricity: false, // unverified — see clubkonnect-adapter.ts header
        supportsCable: false,
      },
      {
        name: "smeplug",
        displayName: "SMEPlug",
        priority: 200,
        supportsAirtime: true,
        supportsData: true,
        supportsElectricity: false,
        supportsCable: false,
      },
    ])
    .onConflictDoNothing();

  console.log("Seeding airtime services (one per network, variable amount)...");

  await db
    .insert(service)
    .values([
      { type: "airtime", network: "MTN", name: "MTN Airtime" },
      { type: "airtime", network: "GLO", name: "Glo Airtime" },
      { type: "airtime", network: "AIRTEL", name: "Airtel Airtime" },
      { type: "airtime", network: "9MOBILE", name: "9mobile Airtime" },
    ])
    .onConflictDoNothing();

  console.log(
    "Seeding illustrative data plans (PLACEHOLDER plan codes — see header comment)...",
  );

  await db
    .insert(service)
    .values([
      {
        type: "data",
        network: "MTN",
        name: "MTN 1GB - 30 Days",
        providerPlanCode: "REPLACE_ME_MTN_1GB",
        priceKobo: 50_000, // NGN 500
      },
      {
        type: "data",
        network: "MTN",
        name: "MTN 2GB - 30 Days",
        providerPlanCode: "REPLACE_ME_MTN_2GB",
        priceKobo: 100_000, // NGN 1,000
      },
      {
        type: "data",
        network: "AIRTEL",
        name: "Airtel 1GB - 30 Days",
        providerPlanCode: "REPLACE_ME_AIRTEL_1GB",
        priceKobo: 50_000,
      },
    ])
    .onConflictDoNothing();

  console.log("Done.");
  process.exit(0);
}

main().catch((err) => {
  console.error("seed-vtu-catalog failed:", err);
  process.exit(1);
});
