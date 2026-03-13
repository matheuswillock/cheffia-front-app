import type { DomainReconciliationStatus } from "./entities";
import { roundCurrency } from "./settlement";

export interface PaymentReconciliationInput {
  internalStatus: string | null;
  providerStatus: string | null;
  internalGrossAmount: number | null;
  providerGrossAmount: number | null;
  internalNetAmount: number | null;
  providerNetAmount: number | null;
}

export interface PaymentReconciliationResult {
  status: DomainReconciliationStatus;
  reason: string | null;
}

const normalizeStatus = (value: string | null): string => (value ?? "").trim().toLowerCase();

const sameAmount = (left: number | null, right: number | null): boolean => {
  if (left === null && right === null) return true;
  if (left === null || right === null) return false;
  return roundCurrency(left) === roundCurrency(right);
};

export const reconcilePaymentState = (
  input: PaymentReconciliationInput
): PaymentReconciliationResult => {
  if (normalizeStatus(input.internalStatus) !== normalizeStatus(input.providerStatus)) {
    return {
      status: "mismatched",
      reason: "payment_status_mismatch",
    };
  }

  if (!sameAmount(input.internalGrossAmount, input.providerGrossAmount)) {
    return {
      status: "mismatched",
      reason: "payment_gross_amount_mismatch",
    };
  }

  if (!sameAmount(input.internalNetAmount, input.providerNetAmount)) {
    return {
      status: "mismatched",
      reason: "payment_net_amount_mismatch",
    };
  }

  return {
    status: "matched",
    reason: null,
  };
};
