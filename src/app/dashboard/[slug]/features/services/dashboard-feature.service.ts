import {
  handleGetRestaurantById,
  handleGetRestaurantFinancialSummary,
} from "@/business/restaurant/restaurantBusiness";
import type { DashboardFeatureData } from "@/app/dashboard/[slug]/features/types/dashboard-feature.types";

export const loadDashboardData = async (supabaseId: string): Promise<DashboardFeatureData> => {
  const restaurant = await handleGetRestaurantById(supabaseId);
  const financialSummary = await handleGetRestaurantFinancialSummary(restaurant.id);

  return {
    restaurant,
    financialSummary,
  };
};
