// File: packages/auth/src/auth.ts
// Purpose: The single Better Auth server instance for Credixa.

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins";
import { db } from "@credixa/db";
import * as schema from "@credixa/db/src/schema"; // Import the full schema object
import { defaultRoles } from "better-auth/plugins/admin/access";
import { env } from "@credixa/config";
import { DEFAULT_ROLE } from "@credixa/types";

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  advanced: {
    // Allows cookie sharing across subdomains/ports on localhost
    crossSubDomainCookies: {
      enabled: true,
    },
  },

  database: drizzleAdapter(db, {
    provider: "pg",
    schema: schema, // Pass full schema object containing tables and relations
  }),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    minPasswordLength: 10,
  },

  user: {
    additionalFields: {
      phone: {
        type: "string",
        required: false,
        input: true,
      },
      kycStatus: {
        type: "string",
        required: false,
        defaultValue: "unverified",
        input: false, // Prevents client-side override
      },
    },
  },

  plugins: [
    admin({
      defaultRole: DEFAULT_ROLE,
      adminRoles: ["admin"],
      roles: {
        admin: defaultRoles.admin, // Keeps full admin permissions (listUsers, getUser, etc.)
        customer: defaultRoles.user, // Base permissions
        agent: defaultRoles.user, // Base agent permissions
      },
    }),
    nextCookies(), // Must remain last
  ],
});

export type Session = typeof auth.$Infer.Session;

export default auth;
