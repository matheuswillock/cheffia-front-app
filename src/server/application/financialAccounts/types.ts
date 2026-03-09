export interface RestaurantFinancialAccountOutput {
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
}

export interface RestaurantFinancialOnboardingDocumentUploadOutput {
  uploadId: string;
  providerDocumentGroupId: string;
  providerDocumentFileId: string | null;
  uploadType: string;
  fileName: string;
  storageBucket: string;
  storagePath: string;
  contentType: string;
  fileSizeBytes: number;
  sha256: string | null;
  status: string;
  errorMessage: string | null;
  uploadedAt: string | null;
  createdAt: string;
}

export interface RestaurantFinancialOnboardingDocumentOutput {
  onboardingDocumentId: string;
  financialAccountId: string;
  providerDocumentGroupId: string;
  type: string;
  title: string;
  description: string | null;
  responsibleName: string | null;
  responsibleType: string | null;
  status: string;
  onboardingUrl: string | null;
  canUploadDirectly: boolean;
  rejectReasons: unknown;
  lastSyncedAt: string | null;
  uploads: RestaurantFinancialOnboardingDocumentUploadOutput[];
}
