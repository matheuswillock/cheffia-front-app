import { AccountApprovalStatus, FinancialOnboardingStatus } from "@prisma/client";
import {
  computeOnboardingStatus,
  mapApprovalStatusValue,
  parseFinancialProviderDateTime,
} from "@/server/domain/financial";

interface MapOnboardingStatusInput {
  general: AccountApprovalStatus;
  documentation: AccountApprovalStatus;
  commercialInfoExpired?: boolean;
}

export const mapApprovalStatus = (value: string | null | undefined): AccountApprovalStatus => {
  const mapped = mapApprovalStatusValue(value);
  return AccountApprovalStatus[mapped];
};

export const mapOnboardingStatus = (
  input: MapOnboardingStatusInput
): FinancialOnboardingStatus => {
  const mapped = computeOnboardingStatus({
    general: input.general,
    documentation: input.documentation,
    commercialInfoExpired: input.commercialInfoExpired,
  });

  return FinancialOnboardingStatus[mapped];
};

export const parseAsaasDateTime = parseFinancialProviderDateTime;
