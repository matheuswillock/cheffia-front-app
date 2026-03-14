"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { loadDashboardData } from "@/app/dashboard/[slug]/features/services/dashboard-feature.service";
import type { DashboardFeatureState } from "@/app/dashboard/[slug]/features/types/dashboard-feature.types";

interface DashboardFeatureContextValue extends DashboardFeatureState {
  reload: () => Promise<void>;
}

const DashboardFeatureContext = createContext<DashboardFeatureContextValue | undefined>(undefined);

interface DashboardFeatureProviderProps {
  children: React.ReactNode;
  slug: string;
}

const initialState: DashboardFeatureState = {
  isLoading: true,
  errorMessage: null,
  restaurant: null,
  financialSummary: null,
};

export function DashboardFeatureProvider({ children, slug }: DashboardFeatureProviderProps) {
  const [state, setState] = useState<DashboardFeatureState>(initialState);
  const latestRequestKey = useRef<string | null>(null);
  const inFlightRequestKey = useRef<string | null>(null);

  const runLoad = useCallback(
    async (requestKey: string) => {
      if (!slug || inFlightRequestKey.current === requestKey) return;

      inFlightRequestKey.current = requestKey;
      setState((current) => ({ ...current, isLoading: true, errorMessage: null }));

      try {
        const data = await loadDashboardData(slug);
        setState({
          isLoading: false,
          errorMessage: null,
          restaurant: data.restaurant,
          financialSummary: data.financialSummary,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Não foi possível carregar o dashboard.";
        setState({
          isLoading: false,
          errorMessage: message,
          restaurant: null,
          financialSummary: null,
        });
      } finally {
        if (inFlightRequestKey.current === requestKey) {
          inFlightRequestKey.current = null;
        }
      }
    },
    [slug]
  );

  useEffect(() => {
    if (!slug) return;

    const requestKey = `dashboard:${slug}`;
    if (
      latestRequestKey.current === requestKey &&
      state.restaurant &&
      state.financialSummary
    ) {
      return;
    }

    latestRequestKey.current = requestKey;
    void runLoad(requestKey);
  }, [runLoad, slug, state.financialSummary, state.restaurant]);

  const reload = useCallback(async () => {
    if (!slug) return;
    const requestKey = `dashboard:${slug}:reload:${Date.now()}`;
    latestRequestKey.current = requestKey;
    await runLoad(requestKey);
  }, [runLoad, slug]);

  const value = useMemo<DashboardFeatureContextValue>(
    () => ({
      isLoading: state.isLoading,
      errorMessage: state.errorMessage,
      restaurant: state.restaurant,
      financialSummary: state.financialSummary,
      reload,
    }),
    [reload, state.errorMessage, state.financialSummary, state.isLoading, state.restaurant]
  );

  return <DashboardFeatureContext.Provider value={value}>{children}</DashboardFeatureContext.Provider>;
}

export const useDashboardFeature = (): DashboardFeatureContextValue => {
  const context = useContext(DashboardFeatureContext);
  if (!context) {
    throw new Error("useDashboardFeature must be used within DashboardFeatureProvider");
  }
  return context;
};
