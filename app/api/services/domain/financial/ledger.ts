import type {
  DomainFeeValueType,
  DomainSettlementStrategy,
  LedgerEntry,
  PayoutTransfer,
} from "./entities";

export interface BuildPaymentLedgerTransitionInput {
  paymentId: string;
  paymentStatus: string;
  grossAmount: number;
  netAmount: number;
  providerFeeAmount: number;
  platformFeeAmount: number;
  occurredAt: Date;
  settlementRuleId: string;
  settlementStrategy: DomainSettlementStrategy;
  platformFeeType: DomainFeeValueType;
  platformFeeValue: number;
  destinationWalletId: string | null;
  sourceWalletId: string | null;
  scheduledFor: Date | null;
}

export interface PaymentLedgerTransition {
  ledgerEntries: LedgerEntry[];
  payoutTransfer: PayoutTransfer | null;
}

const isPaidStatus = (status: string): boolean => status === "paid";
const isRefundLikeStatus = (status: string): boolean => status === "refunded" || status === "canceled";

export const buildPaymentLedgerTransition = (
  input: BuildPaymentLedgerTransitionInput
): PaymentLedgerTransition => {
  const ledgerEntries: LedgerEntry[] = [];

  if (isPaidStatus(input.paymentStatus)) {
    ledgerEntries.push({
      providerReference: `payment:${input.paymentId}:payment_received`,
      entryType: "payment_received",
      direction: "credit",
      grossAmount: input.grossAmount,
      netAmount: input.netAmount,
      feeAmount: input.providerFeeAmount + input.platformFeeAmount,
      occurredAt: input.occurredAt,
      metadata: {
        settlementRuleId: input.settlementRuleId,
        settlementStrategy: input.settlementStrategy,
      },
    });

    if (input.providerFeeAmount > 0) {
      ledgerEntries.push({
        providerReference: `payment:${input.paymentId}:provider_fee`,
        entryType: "provider_fee",
        direction: "debit",
        grossAmount: 0,
        netAmount: 0,
        feeAmount: input.providerFeeAmount,
        occurredAt: input.occurredAt,
        metadata: {
          settlementRuleId: input.settlementRuleId,
        },
      });
    }

    if (input.platformFeeAmount > 0) {
      ledgerEntries.push({
        providerReference: `payment:${input.paymentId}:platform_fee`,
        entryType: "platform_fee",
        direction: "debit",
        grossAmount: 0,
        netAmount: 0,
        feeAmount: input.platformFeeAmount,
        occurredAt: input.occurredAt,
        metadata: {
          settlementRuleId: input.settlementRuleId,
          feeType: input.platformFeeType,
          feeValue: input.platformFeeValue,
        },
      });
    }

    if (
      input.settlementStrategy === "transferencia_posterior" &&
      input.netAmount > 0 &&
      input.destinationWalletId &&
      input.scheduledFor
    ) {
      ledgerEntries.push({
        providerReference: `payment:${input.paymentId}:payout_scheduled`,
        entryType: "payout_scheduled",
        direction: "debit",
        grossAmount: 0,
        netAmount: input.netAmount,
        feeAmount: 0,
        occurredAt: input.scheduledFor,
        metadata: {
          settlementRuleId: input.settlementRuleId,
          destinationWalletId: input.destinationWalletId,
        },
      });

      return {
        ledgerEntries,
        payoutTransfer: {
          amount: input.netAmount,
          currency: "BRL",
          status: "scheduled",
          sourceWalletId: input.sourceWalletId,
          destinationWalletId: input.destinationWalletId,
          scheduledFor: input.scheduledFor,
          metadata: {
            transactionId: input.paymentId,
            settlementRuleId: input.settlementRuleId,
          },
        },
      };
    }
  }

  if (isRefundLikeStatus(input.paymentStatus)) {
    ledgerEntries.push({
      providerReference: `payment:${input.paymentId}:refund`,
      entryType: "refund",
      direction: "debit",
      grossAmount: input.grossAmount,
      netAmount: input.netAmount,
      feeAmount: input.providerFeeAmount + input.platformFeeAmount,
      occurredAt: input.occurredAt,
      metadata: {
        settlementRuleId: input.settlementRuleId,
      },
    });
  }

  return {
    ledgerEntries,
    payoutTransfer: null,
  };
};
