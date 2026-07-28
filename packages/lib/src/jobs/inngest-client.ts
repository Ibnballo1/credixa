// File: packages/lib/src/jobs/inngest-client.ts
// Purpose: The single Inngest client instance. Every job function
//          definition in this directory, AND the Next.js serve() route
//          handler in apps/web, import this same instance — Inngest
//          requires the client passed to `serve()` to be the same one
//          functions were created against.

import { Inngest } from "inngest";

export const inngest = new Inngest({ id: "credixa" });
