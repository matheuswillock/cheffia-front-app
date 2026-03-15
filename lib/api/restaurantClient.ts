import { unauthorized } from "@/lib/utils";
import { redirect } from "next/navigation";
import {
  getRestaurantById,
  getRestaurantFinancialAccount,
  getRestaurantFinancialDocuments,
  getRestaurantFinancialSummary,
  registerRestaurant,
  syncRestaurantFinancialDocuments,
  uploadRestaurantFinancialDocument,
} from "@/lib/api/restaurant";
import type { RegisterRestaurantFormData } from "@/types/formTypes";
import { verifySessionClient } from "@/utils/supabase/client";
import { InputToRegisterRestaurant } from "@/models/dtos/input/InputToRegisterRestaurant";
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

export const registerRestaurantFromForm = async (
  data: RegisterRestaurantFormData
): Promise<OutputRegisterRestaurant> => {
  const normalizedData = {
    ...data,
    document: data.document.replace(/[^0-9]/g, ""),
    phoneNumber: data.phoneNumber.replace(/[^0-9]/g, ""),
    postalCode: data.postalCode.replace(/[^0-9]/g, ""),
    city: data.city.trim(),
    state: data.state.trim().toUpperCase(),
    companyType: data.companyType?.trim().toUpperCase() || undefined,
  };

  const output = await registerRestaurant(InputToRegisterRestaurant.fromFormData(normalizedData));

  if (!output.isValid) {
    throw new Error(output.errorMessages[0] ?? "Erro ao cadastrar restaurante");
  }

  return OutputRegisterRestaurant.fromOutputResult(output);
};

export const getRestaurantBySupabaseIdOrRedirect = async (
  supabaseId: string
): Promise<OutputGetRestaurantById> => {
  const sessionIsValid = await verifySessionClient();

  if (!sessionIsValid) {
    unauthorized();
  }

  const response = await getRestaurantById(supabaseId);

  if (!response.isValid) {
    redirect("/register/restaurant");
  }

  return OutputGetRestaurantById.fromOutputResult(response);
};

export const getRestaurantFinancialAccountOrThrow = async (
  restaurantId: string
): Promise<OutputRestaurantFinancialAccount> => {
  const response = await getRestaurantFinancialAccount(restaurantId);

  if (!response.isValid) {
    throw new Error(response.errorMessages[0] ?? "Erro ao carregar conta financeira");
  }

  return OutputRestaurantFinancialAccount.fromOutputResult(response);
};

export const getRestaurantFinancialSummaryOrThrow = async (
  restaurantId: string
): Promise<OutputRestaurantFinancialSummary> => {
  const response = await getRestaurantFinancialSummary(restaurantId);

  if (!response.isValid) {
    throw new Error(response.errorMessages[0] ?? "Erro ao carregar resumo financeiro");
  }

  return OutputRestaurantFinancialSummary.fromOutputResult(response);
};

export const getRestaurantFinancialDocumentsOrThrow = async (
  restaurantId: string
): Promise<OutputRestaurantFinancialOnboardingDocument[]> => {
  const response = await getRestaurantFinancialDocuments(restaurantId);

  if (!response.isValid) {
    throw new Error(response.errorMessages[0] ?? "Erro ao carregar documentos financeiros");
  }

  return mapRestaurantFinancialOnboardingDocuments(response);
};

export const syncRestaurantFinancialDocumentsOrThrow = async (
  restaurantId: string
): Promise<OutputRestaurantFinancialOnboardingDocument[]> => {
  const response = await syncRestaurantFinancialDocuments(restaurantId);

  if (!response.isValid) {
    throw new Error(response.errorMessages[0] ?? "Erro ao sincronizar documentos financeiros");
  }

  return mapRestaurantFinancialOnboardingDocuments(response);
};

export const uploadRestaurantFinancialDocumentOrThrow = async (
  restaurantId: string,
  documentId: string,
  file: File
): Promise<OutputRestaurantFinancialOnboardingDocumentUpload> => {
  const response = await uploadRestaurantFinancialDocument(restaurantId, documentId, file);

  if (!response.isValid) {
    throw new Error(response.errorMessages[0] ?? "Erro ao enviar documento financeiro");
  }

  return mapRestaurantFinancialOnboardingDocumentUpload(response);
};


