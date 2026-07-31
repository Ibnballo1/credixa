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
  WalletTransactionWithUser,
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
  PaymentWithUser,
} from "./repositories/payment-repository";
export { createPaymentWebhookRepository } from "./repositories/payment-webhook-repository";
export type {
  PaymentWebhookRepository,
  PaymentWebhookRecord,
  LogWebhookInput,
} from "./repositories/payment-webhook-repository";
export { createProviderRepository } from "./repositories/provider-repository";
export type {
  ProviderRepository,
  ProviderRecord,
} from "./repositories/provider-repository";
export { createServiceRepository } from "./repositories/service-repository";
export type {
  ServiceRepository,
  ServiceRecord,
} from "./repositories/service-repository";
export { createVtuPurchaseRepository } from "./repositories/vtu-purchase-repository";
export type {
  VtuPurchaseRepository,
  VtuPurchaseRecord,
  CreateVtuPurchaseInput,
  VtuPurchaseWithDetails,
} from "./repositories/vtu-purchase-repository";
export { createProviderTransactionRepository } from "./repositories/provider-transaction-repository";
export type {
  ProviderTransactionRepository,
  ProviderTransactionRecord,
  LogProviderTransactionInput,
} from "./repositories/provider-transaction-repository";
export { createPricingRuleRepository } from "./repositories/pricing-rule-repository";
export type {
  PricingRuleRepository,
  PricingRuleRecord,
  CreatePricingRuleInput,
} from "./repositories/pricing-rule-repository";
export { createAgentRepository } from "./repositories/agent-repository";
export type {
  AgentRepository,
  AgentRecord,
  AgentWithUser,
  ApplyForAgentInput,
} from "./repositories/agent-repository";

export * from "./pricing";
export * from "./analytics";
export * from "./ledger";
