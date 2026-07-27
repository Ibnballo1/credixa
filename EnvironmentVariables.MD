# Environment Variables

Last updated: Phase 0

All variables are validated at boot through a single Zod schema in
`packages/config/src/env.ts` (to be created in Phase 1). The app fails fast on
missing/malformed env vars rather than failing at an unrelated runtime point.

```bash
# Database
DATABASE_URL=
DIRECT_URL=

# Better Auth
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=

# Paystack
PAYSTACK_SECRET_KEY=
PAYSTACK_PUBLIC_KEY=
PAYSTACK_WEBHOOK_SECRET=

# Resend
RESEND_API_KEY=
RESEND_FROM_EMAIL=

# SMS Provider (abstracted — one active provider at a time)
SMS_PROVIDER=            # e.g. "termii" | "kudisms"
SMS_API_KEY=

# VTU Providers
CLUBKONNECT_API_URL=
CLUBKONNECT_USER_ID=
CLUBKONNECT_API_KEY=
SMEPLUG_API_URL=
SMEPLUG_API_KEY=

# Inngest
INNGEST_EVENT_KEY=
INNGEST_SIGNING_KEY=

# Rate limiting / idempotency locks
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# App
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_ADMIN_URL=
NODE_ENV=
```

## Changelog

- Phase 0: initial variable set defined. Will grow per phase (each phase PR
  updates this file when it introduces a new variable).
