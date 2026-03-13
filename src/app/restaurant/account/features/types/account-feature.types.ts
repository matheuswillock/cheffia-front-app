import type { OutputGetRestaurantById } from "@/models/dtos/output/OutputGetRestaurantById";
import type { OutputRestaurantFinancialAccount } from "@/models/dtos/output/OutputRestaurantFinancialAccount";
import type {
  OutputRestaurantFinancialOnboardingDocument,
} from "@/models/dtos/output/OutputRestaurantFinancialOnboardingDocument";

export interface RestaurantAccountFeatureState {
  restaurant: OutputGetRestaurantById | null;
  financialAccount: OutputRestaurantFinancialAccount | null;
  documents: OutputRestaurantFinancialOnboardingDocument[];
  selectedFiles: Record<string, File | null>;
  fileInputKeys: Record<string, number>;
  isLoading: boolean;
  syncingDocuments: boolean;
  uploadingDocumentId: string | null;
  pageError: string | null;
  documentsError: string | null;
  documentsNotice: string | null;
}
