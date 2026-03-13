import { unauthorized } from "@/lib/utils";
import { redirect } from "next/navigation";
import useWebSocket from "@/hooks/useWebSocket";
import { RegisterRestaurantFormData } from "@/types/formTypes";
import {
  getRestaurantById,
  getRestaurantFinancialAccount,
  getRestaurantFinancialDocuments,
  getRestaurantFinancialSummary,
  registerRestaurant,
  syncRestaurantFinancialDocuments,
  uploadRestaurantFinancialDocument,
} from "@/api/restaurant";
import { verifySessionClient, createClient } from "@/utils/supabase/client";
import { OutputGetRestaurantById } from "@/models/dtos/output/OutputGetRestaurantById";
import { OutputRegisterRestaurant } from "@/models/dtos/output/OutputRegisterRestaurant";
import { OutputRestaurantFinancialAccount } from "@/models/dtos/output/OutputRestaurantFinancialAccount";
import { OutputRestaurantFinancialSummary } from "@/models/dtos/output/OutputRestaurantFinancialSummary";
import {
  mapRestaurantFinancialOnboardingDocumentUpload,
  mapRestaurantFinancialOnboardingDocuments,
  type OutputRestaurantFinancialOnboardingDocument,
  type OutputRestaurantFinancialOnboardingDocumentUpload,
} from "@/models/dtos/output/OutputRestaurantFinancialOnboardingDocument";
import { InputToRegisterRestaurant } from "@/models/dtos/input/InputToRegisterRestaurant";

const API_URL_WEBSOCKET = process.env.NEXT_PUBLIC_API_URL_WEBSOCKET;

export const handleRegisterRestaurant = async (data: RegisterRestaurantFormData): Promise<OutputRegisterRestaurant> => {
  try {
    data.document = data.document.replace(/[^0-9]/g, "");
    data.phoneNumber = data.phoneNumber.replace(/[^0-9]/g, "");
    data.postalCode = data.postalCode.replace(/[^0-9]/g, "");
    data.companyType = data.companyType?.trim().toUpperCase() || undefined;

    const output = await registerRestaurant(InputToRegisterRestaurant.fromFormData(data));

    if (!output.isValid) throw new Error("Erro ao cadastrar restaurante");

    return OutputRegisterRestaurant.fromOutputResult(output);
  } catch (error) {
    console.error("Error registering restaurant:", error);
    throw error;
  }
};

export const handleGetRestaurantById = async (id: string): Promise<OutputGetRestaurantById> => {
  try {
    const sessionIsValid = await verifySessionClient();

    if (!sessionIsValid) unauthorized();

    const response = await getRestaurantById(id);

    if (!response.isValid) redirect("/register/restaurant");

    return OutputGetRestaurantById.fromOutputResult(response);
  } catch (error) {
    console.error("Error getting restaurant:", error);
    throw error;
  }
};

export const handleGetRestaurantFinancialAccount = async (
  restaurantId: string
): Promise<OutputRestaurantFinancialAccount> => {
  try {
    const response = await getRestaurantFinancialAccount(restaurantId);

    if (!response.isValid) {
      throw new Error(response.errorMessages[0] ?? "Erro ao carregar conta financeira");
    }

    return OutputRestaurantFinancialAccount.fromOutputResult(response);
  } catch (error) {
    console.error("Error getting restaurant financial account:", error);
    throw error;
  }
};

export const handleGetRestaurantFinancialSummary = async (
  restaurantId: string
): Promise<OutputRestaurantFinancialSummary> => {
  try {
    const response = await getRestaurantFinancialSummary(restaurantId);

    if (!response.isValid) {
      throw new Error(response.errorMessages[0] ?? "Erro ao carregar resumo financeiro");
    }

    return OutputRestaurantFinancialSummary.fromOutputResult(response);
  } catch (error) {
    console.error("Error getting restaurant financial summary:", error);
    throw error;
  }
};

export const handleGetRestaurantFinancialDocuments = async (
  restaurantId: string
): Promise<OutputRestaurantFinancialOnboardingDocument[]> => {
  try {
    const response = await getRestaurantFinancialDocuments(restaurantId);

    if (!response.isValid) {
      throw new Error(response.errorMessages[0] ?? "Erro ao carregar documentos financeiros");
    }

    return mapRestaurantFinancialOnboardingDocuments(response);
  } catch (error) {
    console.error("Error getting restaurant financial documents:", error);
    throw error;
  }
};

export const handleSyncRestaurantFinancialDocuments = async (
  restaurantId: string
): Promise<OutputRestaurantFinancialOnboardingDocument[]> => {
  try {
    const response = await syncRestaurantFinancialDocuments(restaurantId);

    if (!response.isValid) {
      throw new Error(response.errorMessages[0] ?? "Erro ao sincronizar documentos financeiros");
    }

    return mapRestaurantFinancialOnboardingDocuments(response);
  } catch (error) {
    console.error("Error syncing restaurant financial documents:", error);
    throw error;
  }
};

export const handleUploadRestaurantFinancialDocument = async (
  restaurantId: string,
  documentId: string,
  file: File
): Promise<OutputRestaurantFinancialOnboardingDocumentUpload> => {
  try {
    const response = await uploadRestaurantFinancialDocument(restaurantId, documentId, file);

    if (!response.isValid) {
      throw new Error(response.errorMessages[0] ?? "Erro ao enviar documento financeiro");
    }

    return mapRestaurantFinancialOnboardingDocumentUpload(response);
  } catch (error) {
    console.error("Error uploading restaurant financial document:", error);
    throw error;
  }
};

export const useRestaurantWebSocket = (restaurantId: string) => {
  const { messages, sendMessage } = useWebSocket(`${API_URL_WEBSOCKET}/order-hub/connect/${restaurantId}/true`);

  return { messages, sendMessage };
};

export const handleLogout = async () => {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) return redirect("/error");

  return redirect("/sign-in");
};
