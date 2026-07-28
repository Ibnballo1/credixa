// File: packages/db/drizzle.config.ts
// Purpose: Drizzle Kit configuration — points migration generation/push at
//          the schema files and the database connection. DIRECT_URL (not
//          the pooled DATABASE_URL) is used here because migrations must
//          run against a direct, non-pooled connection.

import { defineConfig } from "drizzle-kit";
import { env } from "@credixa/config";

export default defineConfig({
  schema: "./src/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  schemaFilter: ["public"],
  dbCredentials: {
    url: env.DIRECT_URL,
  },
  strict: true,
  verbose: true,
});
