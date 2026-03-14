export interface StorageUploadInput {
  tenantId: string;
  menuId: string;
  fileName: string;
  contentType: string;
  data: Uint8Array;
}

export interface StorageUploadResult {
  path: string;
  publicUrl: string;
}

export interface PrivateStorageUploadResult {
  bucket: string;
  path: string;
}

export interface FinancialDocumentStorageUploadInput {
  tenantId: string;
  restaurantId: string;
  financialAccountId: string;
  onboardingDocumentId: string;
  fileName: string;
  contentType: string;
  data: Uint8Array;
}

export interface MenuMediaStorage {
  uploadMenuItemMedia(input: StorageUploadInput): Promise<StorageUploadResult>;
  removeMenuItemMedia(path: string): Promise<void>;
}

export interface FinancialDocumentStorage {
  uploadOnboardingDocument(
    input: FinancialDocumentStorageUploadInput
  ): Promise<PrivateStorageUploadResult>;
}
