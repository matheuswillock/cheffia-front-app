import { redirect } from "next/navigation";
import { RestaurantService } from "@/app/api/useCases/restaurant/restaurantService";
import { verifySessionServer } from "@/utils/supabase/server";

export interface RestaurantPortalContext {
  restaurantId: string;
  user: {
    name: string;
    email: string;
    avatar: string;
    supabaseId: string;
  };
}

export const resolveRestaurantPortalContext = async (): Promise<RestaurantPortalContext> => {
  const session = await verifySessionServer();
  if (!session) {
    redirect("/sign-in");
  }

  const service = new RestaurantService();
  const tenantId = await service.getTenantBySupabaseId(session.id);
  if (!tenantId) {
    redirect("/register/restaurant");
  }

  const output = await service.requestBySupabaseId(tenantId, session.id);
  if (!output.isValid || !output.result) {
    redirect("/register/restaurant");
  }

  const restaurant = output.result;

  return {
    restaurantId: restaurant.id,
    user: {
      name: restaurant.name || restaurant.ownerFullName || "Restaurante",
      email: restaurant.email || session.email || "",
      avatar: restaurant.providerAvatarUrl || "",
      supabaseId: restaurant.supabaseId || session.id,
    },
  };
};
