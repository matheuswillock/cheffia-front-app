import type { DomainFeeValueType, DomainSettlementStrategy } from "./entities";

export interface ComputeAvailableAtInput {
  settlementStrategy: DomainSettlementStrategy;
  transferDelayDays: number;
  paymentDate: Date | null;
  providerAvailableAt: Date | null;
}

export const roundCurrency = (value: number): number =>
  Math.round((value + Number.EPSILON) * 100) / 100;

export const addDays = (value: Date, days: number): Date => {
  const next = new Date(value);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
};

export const computePlatformFeeAmount = (
  grossAmount: number,
  platformFeeType: DomainFeeValueType,
  platformFeeValue: number
): number => {
  if (platformFeeValue <= 0 || grossAmount <= 0) return 0;

  if (platformFeeType === "fixed") {
    return roundCurrency(Math.min(platformFeeValue, grossAmount));
  }

  return roundCurrency((grossAmount * platformFeeValue) / 100);
};

export const computeProviderFeeAmount = (
  grossAmount: number,
  providerNetValue: number | null,
  fallbackProviderFeeAmount: number | null
): number => {
  if (providerNetValue !== null) {
    return roundCurrency(Math.max(grossAmount - providerNetValue, 0));
  }

  return roundCurrency(Math.max(fallbackProviderFeeAmount ?? 0, 0));
};

export const computeNetAmount = (
  grossAmount: number,
  providerFeeAmount: number,
  platformFeeAmount: number
): number => roundCurrency(Math.max(grossAmount - providerFeeAmount - platformFeeAmount, 0));

export const computeAvailableAt = (input: ComputeAvailableAtInput): Date | null => {
  if (input.settlementStrategy === "transferencia_posterior") {
    return input.paymentDate ? addDays(input.paymentDate, input.transferDelayDays) : null;
  }

  return input.providerAvailableAt ?? input.paymentDate;
};
