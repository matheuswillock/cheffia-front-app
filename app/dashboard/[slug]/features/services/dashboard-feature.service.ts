import {
  getRestaurantBySupabaseIdOrRedirect,
  getRestaurantFinancialSummaryOrThrow,
} from "@/api/restaurantClient";
import type { DashboardFeatureData } from "@/app/dashboard/[slug]/features/types/dashboard-feature.types";

export const loadDashboardData = async (supabaseId: string): Promise<DashboardFeatureData> => {
  const restaurant = await getRestaurantBySupabaseIdOrRedirect(supabaseId);
  const financialSummary = await getRestaurantFinancialSummaryOrThrow(restaurant.id);

  return {
    restaurant,
    financialSummary,
  };
};
