// File: packages/db/src/index.ts
// Purpose: Public entry point for @credixa/db.

export { db } from "./client";
export type { Database } from "./client";
export * from "./schema";
export { createUserRepository } from "./repositories/user-repository";
export type {
  UserRepository,
  UserRecord,
} from "./repositories/user-repository";
export { createWalletRepository } from "./repositories/wallet-repository";
export type {
  WalletRepository,
  WalletRecord,
} from "./repositories/wallet-repository";
export { createNotificationRepository } from "./repositories/notification-repository";
export type {
  NotificationRepository,
  NotificationRecord,
} from "./repositories/notification-repository";
export { createWalletTransactionRepository } from "./repositories/wallet-transaction-repository";
export type {
  WalletTransactionRepository,
  WalletTransactionRecord,
} from "./repositories/wallet-transaction-repository";
export { createWalletHoldRepository } from "./repositories/wallet-hold-repository";
export type {
  WalletHoldRepository,
  WalletHoldRecord,
} from "./repositories/wallet-hold-repository";
export { createIdempotencyRepository } from "./repositories/idempotency-repository";
export type {
  IdempotencyRepository,
  IdempotencyKeyRecord,
} from "./repositories/idempotency-repository";
export { createAuditLogRepository } from "./repositories/audit-log-repository";
export type {
  AuditLogRepository,
  AuditLogRecord,
  CreateAuditLogInput,
} from "./repositories/audit-log-repository";
export { createPaymentRepository } from "./repositories/payment-repository";
export type {
  PaymentRepository,
  PaymentRecord,
  CreatePaymentInput,
} from "./repositories/payment-repository";
export { createPaymentWebhookRepository } from "./repositories/payment-webhook-repository";
export type {
  PaymentWebhookRepository,
  PaymentWebhookRecord,
  LogWebhookInput,
} from "./repositories/payment-webhook-repository";

export * from "./ledger";
