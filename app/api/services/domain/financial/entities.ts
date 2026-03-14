export type DomainApprovalStatus =
  | "pending"
  | "awaiting_approval"
  | "approved"
  | "rejected"
  | "unknown";

export type DomainOnboardingStatus =
  | "draft"
  | "provisioning"
  | "account_created"
  | "awaiting_documents"
  | "awaiting_review"
  | "approved"
  | "rejected"
  | "blocked"
  | "failed"
  | "commercial_info_expired";

export type DomainSettlementStrategy = "split_automatico" | "transferencia_posterior";
export type DomainFeeValueType = "fixed" | "percentage";
export type DomainLedgerEntryType =
  | "charge_created"
  | "charge_paid"
  | "payment_received"
  | "provider_fee"
  | "platform_fee"
  | "payout_scheduled"
  | "payout_completed"
  | "payout_failed"
  | "refund"
  | "adjustment"
  | "reconciliation";
export type DomainEntryDirection = "credit" | "debit";
export type DomainPayoutTransferStatus =
  | "scheduled"
  | "processing"
  | "completed"
  | "failed"
  | "canceled";
export type DomainReconciliationStatus = "pending" | "matched" | "mismatched" | "ignored" | "failed";

export interface FinancialAccount {
  id: string;
  restaurantId: string;
  provider: string;
  accountType: string;
  onboardingStatus: DomainOnboardingStatus;
  generalStatus: DomainApprovalStatus;
  commercialInfoStatus: DomainApprovalStatus;
  bankAccountStatus: DomainApprovalStatus;
  documentationStatus: DomainApprovalStatus;
  webhookStatus: string;
  asaasAccountId: string | null;
  asaasWalletId: string | null;
  commercialInfoExpirationScheduledAt: Date | null;
  commercialInfoIsExpired: boolean;
}

export interface OnboardingDocument {
  onboardingDocumentId: string;
  financialAccountId: string;
  providerDocumentGroupId: string;
  type: string;
  title: string;
  description: string | null;
  onboardingUrl: string | null;
  status: DomainApprovalStatus;
  rejectReasons: unknown;
}

export interface PayerProfile {
  name: string;
  phoneNumber: string;
  email: string | null;
  document: string | null;
  normalizedPhoneNumber: string;
  normalizedDocument: string | null;
}

export interface SettlementRule {
  id: string;
  financialAccountId: string | null;
  destinationWalletId: string | null;
  settlementStrategy: DomainSettlementStrategy;
  platformFeeType: DomainFeeValueType;
  platformFeeValue: number;
  transferDelayDays: number;
}

export interface PixCharge {
  id: string;
  amountInCents: number;
  status: string;
  method: "pix";
  brCode: string | null;
  brCodeBase64: string | null;
  description: string;
  createdAt: string;
  updatedAt: string;
  expiresAt: string | null;
}

export interface LedgerEntry {
  providerReference: string;
  entryType: DomainLedgerEntryType;
  direction: DomainEntryDirection;
  grossAmount: number;
  netAmount: number;
  feeAmount: number;
  occurredAt: Date;
  metadata?: Record<string, unknown>;
}

export interface PayoutTransfer {
  amount: number;
  currency: string;
  status: DomainPayoutTransferStatus;
  sourceWalletId: string | null;
  destinationWalletId: string;
  scheduledFor: Date;
  metadata?: Record<string, unknown>;
}
