# Security Posture

Last updated: Phase 0

Tracks OWASP-aligned requirements and their implementation status across phases.

| Control                      | Approach                                                                                    | Status                                           |
| ---------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| Authentication               | Better Auth, secure sessions                                                                | Planned — Phase 1                                |
| Authorization / RBAC         | `roles` + `user_roles`, guard helpers in `packages/auth`                                    | Planned — Phase 1                                |
| Input validation             | Zod schemas at every server action / route handler boundary                                 | Planned — ongoing                                |
| SQL injection protection     | Drizzle ORM only, never inline SQL                                                          | Enforced by convention every phase               |
| XSS protection               | React escaping by default; no `dangerouslySetInnerHTML` without sanitization                | Ongoing                                          |
| CSRF protection              | Server Actions' built-in origin checks; Route Handlers use explicit checks where applicable | Planned — Phase 1                                |
| Rate limiting                | Upstash Redis + `@upstash/ratelimit`                                                        | Planned — Phase 4 (payments), extended elsewhere |
| Secure headers               | Next.js `headers()` config (CSP, HSTS, X-Frame-Options, etc.)                               | Planned — Phase 0/1 repo scaffold                |
| Webhook verification         | Server-side HMAC verification of Paystack signature before any DB write                     | Planned — Phase 4                                |
| Audit logging                | `audit_logs` table, immutable, written inside the same transaction as the privileged action | Planned — Phase 3 onward                         |
| Immutable financial records  | No hard deletes on ledger/transaction tables; compensating entries only                     | Planned — Phase 3                                |
| Secure environment variables | Zod-validated env schema, secrets never in client bundle, admin/web app isolation           | Planned — Phase 1                                |

## Changelog

- Phase 0: control matrix defined, statuses tracked per phase going forward.
