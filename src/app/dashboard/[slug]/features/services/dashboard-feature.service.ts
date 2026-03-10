import { handleGetRestaurantById } from "@/business/restaurant/restaurantBusiness";
import type { OutputGetRestaurantById } from "@/models/dtos/output/OutputGetRestaurantById";

export const loadDashboardRestaurant = async (supabaseId: string): Promise<OutputGetRestaurantById> => {
  return handleGetRestaurantById(supabaseId);
};
