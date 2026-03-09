import { Output } from "@/models/Output";

export interface OutputRestaurantFinancialOnboardingDocumentUpload {
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

export interface OutputRestaurantFinancialOnboardingDocument {
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
  uploads: OutputRestaurantFinancialOnboardingDocumentUpload[];
}

export const mapRestaurantFinancialOnboardingDocuments = (
  output: Output
): OutputRestaurantFinancialOnboardingDocument[] =>
  (output.result ?? []) as OutputRestaurantFinancialOnboardingDocument[];

export const mapRestaurantFinancialOnboardingDocumentUpload = (
  output: Output
): OutputRestaurantFinancialOnboardingDocumentUpload =>
  output.result as OutputRestaurantFinancialOnboardingDocumentUpload;
