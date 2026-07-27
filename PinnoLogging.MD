# ADR 0002: Use pino for Structured Logging

Status: Proposed — needs sign-off (not in original tech stack list)

## Context

The brief prohibits `console.log` in production and requires structured
logging, request IDs, and correlation IDs.

## Decision

Use `pino` wrapped in a `packages/lib/src/logger` module. Every server action /
route handler attaches a request ID and correlation ID (propagated from
incoming request headers where present, generated otherwise) to all log lines
for that request.

## Alternatives Considered

- **Vercel's built-in console output only**: not structured, no correlation
  ID propagation, harder to query in an aggregator later.
- **Winston**: comparable feature set, heavier and slower than pino in
  benchmarks; pino is the more common choice in modern Next.js/serverless
  contexts.

## Consequences

- New dependency.
- Establishes one logging convention used identically across `apps/web` and
  `apps/admin` via the shared `packages/lib` module.
