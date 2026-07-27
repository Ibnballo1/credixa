# ADR 0001: Use Upstash Redis for Rate Limiting & Idempotency Locks

Status: Proposed — needs sign-off (not in original tech stack list)

## Context

The brief requires rate limiting and robust idempotency handling. Vercel's
serverless/edge runtime has no built-in persistent store for either.

## Decision

Use Upstash Redis (`@upstash/ratelimit` + `@upstash/redis`) for:

- Rate limiting on sensitive endpoints (auth, wallet funding, VTU purchase).
- Short-term distributed locks supporting idempotency key checks under
  concurrent requests.

## Alternatives Considered

- **In-memory rate limiting**: doesn't work across serverless instances.
- **Postgres-based rate limiting**: adds write load to the primary DB for a
  concern that's a poor fit for a relational store; also slower than Redis for
  this access pattern.

## Consequences

- New infrastructure dependency and cost (Upstash has a free tier sufficient
  for early stage).
- Native compatibility with Vercel edge/serverless — no connection pooling
  issues.
