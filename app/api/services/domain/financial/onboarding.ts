import type { DomainApprovalStatus, DomainOnboardingStatus } from "./entities";

export interface ComputeOnboardingStatusInput {
  general: DomainApprovalStatus;
  documentation: DomainApprovalStatus;
  commercialInfoExpired?: boolean;
}

export const mapApprovalStatusValue = (value: string | null | undefined): DomainApprovalStatus => {
  switch ((value ?? "").trim().toUpperCase()) {
    case "APPROVED":
      return "approved";
    case "REJECTED":
      return "rejected";
    case "AWAITING_APPROVAL":
      return "awaiting_approval";
    case "PENDING":
      return "pending";
    default:
      return "unknown";
  }
};

export const computeOnboardingStatus = (
  input: ComputeOnboardingStatusInput
): DomainOnboardingStatus => {
  if (input.commercialInfoExpired) {
    return "commercial_info_expired";
  }

  if (input.general === "approved") {
    return "approved";
  }

  if (input.general === "rejected" || input.documentation === "rejected") {
    return "rejected";
  }

  if (input.general === "awaiting_approval" || input.documentation === "awaiting_approval") {
    return "awaiting_review";
  }

  if (input.documentation === "pending") {
    return "awaiting_documents";
  }

  return "account_created";
};

export const parseFinancialProviderDateTime = (value: string | null | undefined): Date | null => {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return new Date(`${trimmed}T00:00:00.000Z`);
  }

  const normalized = trimmed.includes("T") ? trimmed : trimmed.replace(" ", "T");
  const hasTimeZone = /(?:[zZ]|[+-]\d{2}:\d{2})$/.test(normalized);
  const candidate = hasTimeZone ? normalized : `${normalized}Z`;
  const parsed = new Date(candidate);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
};
