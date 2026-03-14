import { Output } from "@/models/Output";

export class OutputRestaurantFinancialAccount {
  financialAccountId: string;
  restaurantId: string;
  provider: string;
  accountType: string;
  onboardingStatus: string;
  generalStatus: string;
  commercialInfoStatus: string;
  bankAccountStatus: string;
  documentationStatus: string;
  webhookStatus: string;
  commercialInfoExpirationScheduledAt: string | null;
  commercialInfoIsExpired: boolean;
  lastStatusSyncAt: string | null;
  asaasAccountId: string | null;
  asaasWalletId: string | null;
  hasEncryptedApiKey: boolean;
  missingFields: string[];
  lastError: string | null;

  constructor(
    financialAccountId: string,
    restaurantId: string,
    provider: string,
    accountType: string,
    onboardingStatus: string,
    generalStatus: string,
    commercialInfoStatus: string,
    bankAccountStatus: string,
    documentationStatus: string,
    webhookStatus: string,
    commercialInfoExpirationScheduledAt: string | null,
    commercialInfoIsExpired: boolean,
    lastStatusSyncAt: string | null,
    asaasAccountId: string | null,
    asaasWalletId: string | null,
    hasEncryptedApiKey: boolean,
    missingFields: string[],
    lastError: string | null
  ) {
    this.financialAccountId = financialAccountId;
    this.restaurantId = restaurantId;
    this.provider = provider;
    this.accountType = accountType;
    this.onboardingStatus = onboardingStatus;
    this.generalStatus = generalStatus;
    this.commercialInfoStatus = commercialInfoStatus;
    this.bankAccountStatus = bankAccountStatus;
    this.documentationStatus = documentationStatus;
    this.webhookStatus = webhookStatus;
    this.commercialInfoExpirationScheduledAt = commercialInfoExpirationScheduledAt;
    this.commercialInfoIsExpired = commercialInfoIsExpired;
    this.lastStatusSyncAt = lastStatusSyncAt;
    this.asaasAccountId = asaasAccountId;
    this.asaasWalletId = asaasWalletId;
    this.hasEncryptedApiKey = hasEncryptedApiKey;
    this.missingFields = missingFields;
    this.lastError = lastError;
  }

  static fromOutputResult(output: Output): OutputRestaurantFinancialAccount {
    return new OutputRestaurantFinancialAccount(
      output.result.financialAccountId,
      output.result.restaurantId,
      output.result.provider,
      output.result.accountType,
      output.result.onboardingStatus,
      output.result.generalStatus,
      output.result.commercialInfoStatus,
      output.result.bankAccountStatus,
      output.result.documentationStatus,
      output.result.webhookStatus,
      output.result.commercialInfoExpirationScheduledAt,
      output.result.commercialInfoIsExpired,
      output.result.lastStatusSyncAt,
      output.result.asaasAccountId,
      output.result.asaasWalletId,
      output.result.hasEncryptedApiKey,
      output.result.missingFields,
      output.result.lastError
    );
  }
}
