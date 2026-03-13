import {
  handleGetRestaurantById,
  handleGetRestaurantFinancialAccount,
  handleGetRestaurantFinancialDocuments,
  handleSyncRestaurantFinancialDocuments,
  handleUploadRestaurantFinancialDocument,
} from "@/business/restaurant/restaurantBusiness";
import type { OutputGetRestaurantById } from "@/models/dtos/output/OutputGetRestaurantById";
import type { OutputRestaurantFinancialAccount } from "@/models/dtos/output/OutputRestaurantFinancialAccount";
import type { OutputRestaurantFinancialOnboardingDocument } from "@/models/dtos/output/OutputRestaurantFinancialOnboardingDocument";
import { verifySessionClient } from "@/utils/supabase/client";

export interface RestaurantAccountViewData {
  restaurant: OutputGetRestaurantById;
  financialAccount: OutputRestaurantFinancialAccount;
  documents: OutputRestaurantFinancialOnboardingDocument[];
}

export const loadRestaurantAccountView = async (): Promise<RestaurantAccountViewData> => {
  const user = await verifySessionClient();
  if (!user) {
    throw new Error("Sessão inválida.");
  }

  const restaurant = await handleGetRestaurantById(user.id);
  const [financialAccount, documents] = await Promise.all([
    handleGetRestaurantFinancialAccount(restaurant.id),
    handleGetRestaurantFinancialDocuments(restaurant.id),
  ]);

  return {
    restaurant,
    financialAccount,
    documents,
  };
};

export const syncRestaurantAccountDocuments = async (
  restaurantId: string
): Promise<{
  financialAccount: OutputRestaurantFinancialAccount;
  documents: OutputRestaurantFinancialOnboardingDocument[];
}> => {
  const [documents, financialAccount] = await Promise.all([
    handleSyncRestaurantFinancialDocuments(restaurantId),
    handleGetRestaurantFinancialAccount(restaurantId),
  ]);

  return {
    financialAccount,
    documents,
  };
};

export const uploadRestaurantAccountDocument = async (
  restaurantId: string,
  documentId: string,
  file: File
): Promise<void> => {
  await handleUploadRestaurantFinancialDocument(restaurantId, documentId, file);
};
