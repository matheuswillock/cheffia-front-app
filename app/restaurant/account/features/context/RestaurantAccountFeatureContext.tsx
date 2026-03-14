"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  loadRestaurantAccountView,
  syncRestaurantAccountDocuments,
  uploadRestaurantAccountDocument,
} from "@/app/restaurant/account/features/services/account-feature.service";
import type { RestaurantAccountFeatureState } from "@/app/restaurant/account/features/types/account-feature.types";
import type { OutputRestaurantFinancialOnboardingDocument } from "@/models/dtos/output/OutputRestaurantFinancialOnboardingDocument";

interface RestaurantAccountFeatureContextValue extends RestaurantAccountFeatureState {
  reload: () => Promise<void>;
  syncDocuments: () => Promise<void>;
  selectFile: (documentId: string, file: File | null) => void;
  uploadDocument: (document: OutputRestaurantFinancialOnboardingDocument) => Promise<void>;
}

const RestaurantAccountFeatureContext = createContext<RestaurantAccountFeatureContextValue | undefined>(
  undefined
);

const initialState: RestaurantAccountFeatureState = {
  restaurant: null,
  financialAccount: null,
  documents: [],
  selectedFiles: {},
  fileInputKeys: {},
  isLoading: true,
  syncingDocuments: false,
  uploadingDocumentId: null,
  pageError: null,
  documentsError: null,
  documentsNotice: null,
};

export function RestaurantAccountFeatureProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<RestaurantAccountFeatureState>(initialState);
  const latestRequestKey = useRef<string | null>(null);
  const inFlightRequestKey = useRef<string | null>(null);

  const runLoad = useCallback(async (requestKey: string) => {
    if (inFlightRequestKey.current === requestKey) return;

    inFlightRequestKey.current = requestKey;
    setState((current) => ({ ...current, isLoading: true, pageError: null }));

    try {
      const data = await loadRestaurantAccountView();
      setState((current) => ({
        ...current,
        restaurant: data.restaurant,
        financialAccount: data.financialAccount,
        documents: data.documents,
        isLoading: false,
        pageError: null,
      }));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Não foi possível carregar a conta financeira.";
      setState((current) => ({
        ...current,
        isLoading: false,
        pageError: message,
      }));
    } finally {
      if (inFlightRequestKey.current === requestKey) {
        inFlightRequestKey.current = null;
      }
    }
  }, []);

  useEffect(() => {
    const requestKey = "restaurant-account:load";
    if (latestRequestKey.current === requestKey && state.restaurant && state.financialAccount) return;
    latestRequestKey.current = requestKey;
    void runLoad(requestKey);
  }, [runLoad, state.financialAccount, state.restaurant]);

  const reload = useCallback(async () => {
    const requestKey = `restaurant-account:reload:${Date.now()}`;
    latestRequestKey.current = requestKey;
    await runLoad(requestKey);
  }, [runLoad]);

  const syncDocuments = useCallback(async () => {
    if (!state.restaurant || state.syncingDocuments) return;

    try {
      setState((current) => ({
        ...current,
        syncingDocuments: true,
        documentsNotice: null,
        documentsError: null,
      }));

      const data = await syncRestaurantAccountDocuments(state.restaurant.id);
      setState((current) => ({
        ...current,
        financialAccount: data.financialAccount,
        documents: data.documents,
        syncingDocuments: false,
        documentsNotice: "Documentos financeiros sincronizados com sucesso.",
      }));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Não foi possível sincronizar os documentos financeiros.";
      setState((current) => ({
        ...current,
        syncingDocuments: false,
        documentsError: message,
      }));
    }
  }, [state.restaurant, state.syncingDocuments]);

  const selectFile = useCallback((documentId: string, file: File | null) => {
    setState((current) => ({
      ...current,
      selectedFiles: {
        ...current.selectedFiles,
        [documentId]: file,
      },
    }));
  }, []);

  const resetSelectedFile = useCallback((documentId: string) => {
    setState((current) => ({
      ...current,
      selectedFiles: {
        ...current.selectedFiles,
        [documentId]: null,
      },
      fileInputKeys: {
        ...current.fileInputKeys,
        [documentId]: (current.fileInputKeys[documentId] ?? 0) + 1,
      },
    }));
  }, []);

  const uploadDocument = useCallback(
    async (document: OutputRestaurantFinancialOnboardingDocument) => {
      if (!state.restaurant) return;

      const file = state.selectedFiles[document.onboardingDocumentId];
      if (!file) {
        setState((current) => ({
          ...current,
          documentsError: "Selecione um arquivo antes de enviar o documento.",
        }));
        return;
      }

      try {
        setState((current) => ({
          ...current,
          uploadingDocumentId: document.onboardingDocumentId,
          documentsNotice: null,
          documentsError: null,
        }));

        await uploadRestaurantAccountDocument(state.restaurant.id, document.onboardingDocumentId, file);
        resetSelectedFile(document.onboardingDocumentId);

        const data = await syncRestaurantAccountDocuments(state.restaurant.id);
        setState((current) => ({
          ...current,
          financialAccount: data.financialAccount,
          documents: data.documents,
          uploadingDocumentId: null,
          documentsNotice: "Documento salvo no Cheffia e enviado ao Asaas.",
        }));
      } catch (error) {
        const message = error instanceof Error ? error.message : "Não foi possível enviar o documento.";
        setState((current) => ({
          ...current,
          uploadingDocumentId: null,
          documentsError: message,
        }));
      }
    },
    [resetSelectedFile, state.restaurant, state.selectedFiles]
  );

  const value = useMemo<RestaurantAccountFeatureContextValue>(
    () => ({
      ...state,
      reload,
      syncDocuments,
      selectFile,
      uploadDocument,
    }),
    [reload, selectFile, state, syncDocuments, uploadDocument]
  );

  return (
    <RestaurantAccountFeatureContext.Provider value={value}>
      {children}
    </RestaurantAccountFeatureContext.Provider>
  );
}

export const useRestaurantAccountFeature = (): RestaurantAccountFeatureContextValue => {
  const context = useContext(RestaurantAccountFeatureContext);
  if (!context) {
    throw new Error("useRestaurantAccountFeature must be used within RestaurantAccountFeatureProvider");
  }
  return context;
};
