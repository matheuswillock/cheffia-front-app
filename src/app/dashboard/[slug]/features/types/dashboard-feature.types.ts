import type { OutputGetRestaurantById } from "@/models/dtos/output/OutputGetRestaurantById";

export interface DashboardFeatureState {
  isLoading: boolean;
  errorMessage: string | null;
  restaurant: OutputGetRestaurantById | null;
}
