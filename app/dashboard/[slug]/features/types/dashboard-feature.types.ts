import type { OutputGetRestaurantById } from "@/models/dtos/output/OutputGetRestaurantById";
import type { OutputRestaurantFinancialSummary } from "@/models/dtos/output/OutputRestaurantFinancialSummary";

export interface DashboardFeatureData {
  restaurant: OutputGetRestaurantById;
  financialSummary: OutputRestaurantFinancialSummary;
}

export interface DashboardFeatureState {
  isLoading: boolean;
  errorMessage: string | null;
  restaurant: OutputGetRestaurantById | null;
  financialSummary: OutputRestaurantFinancialSummary | null;
}
