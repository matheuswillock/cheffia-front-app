import { AccountApprovalStatus, FinancialOnboardingStatus } from "@prisma/client";

interface MapOnboardingStatusInput {
  general: AccountApprovalStatus;
  documentation: AccountApprovalStatus;
  commercialInfoExpired?: boolean;
}

export const mapApprovalStatus = (value: string | null | undefined): AccountApprovalStatus => {
  switch ((value ?? "").trim().toUpperCase()) {
    case "APPROVED":
      return AccountApprovalStatus.approved;
    case "REJECTED":
      return AccountApprovalStatus.rejected;
    case "AWAITING_APPROVAL":
      return AccountApprovalStatus.awaiting_approval;
    case "PENDING":
      return AccountApprovalStatus.pending;
    default:
      return AccountApprovalStatus.unknown;
  }
};

export const mapOnboardingStatus = (
  input: MapOnboardingStatusInput
): FinancialOnboardingStatus => {
  if (input.commercialInfoExpired) {
    return FinancialOnboardingStatus.commercial_info_expired;
  }

  if (input.general === AccountApprovalStatus.approved) {
    return FinancialOnboardingStatus.approved;
  }

  if (
    input.general === AccountApprovalStatus.rejected ||
    input.documentation === AccountApprovalStatus.rejected
  ) {
    return FinancialOnboardingStatus.rejected;
  }

  if (
    input.general === AccountApprovalStatus.awaiting_approval ||
    input.documentation === AccountApprovalStatus.awaiting_approval
  ) {
    return FinancialOnboardingStatus.awaiting_review;
  }

  if (input.documentation === AccountApprovalStatus.pending) {
    return FinancialOnboardingStatus.awaiting_documents;
  }

  return FinancialOnboardingStatus.account_created;
};

export const parseAsaasDateTime = (value: string | null | undefined): Date | null => {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return null;

  const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/;
  if (dateOnlyPattern.test(trimmed)) {
    return new Date(`${trimmed}T00:00:00.000Z`);
  }

  const normalized = trimmed.includes("T") ? trimmed : trimmed.replace(" ", "T");
  const hasTimeZone = /(?:[zZ]|[+-]\d{2}:\d{2})$/.test(normalized);
  const candidate = hasTimeZone ? normalized : `${normalized}Z`;
  const parsed = new Date(candidate);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
};
