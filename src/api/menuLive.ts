import { Output } from "@/models/Output";
import { cheffiaApiConfig } from "@/api/config/cheffiaApiConfig";
import { MenuLiveRoutes } from "./routes/routesConfig";

export const GetMenuByRestaurantIdAndTableNumber = async (): Promise<Output> => {
  try {
    console.log('GetMenuByRestaurantIdAndTableNumber');

    const response = await cheffiaApiConfig.get(
      MenuLiveRoutes.getMenuLiveByTable(
        '16ddd75a-58e3-4f3b-9fb7-23dee72d557b',
        '12'
      )
    );

    console.log('response', response.data);

    return response.data;
  } catch (error: any) {
    if (error.response) {
      console.error("Error response data:", error.response.data);
      console.error("Error response status:", error.response.status);
      console.error("Error response headers:", error.response.headers);
      return new Output(false, [], ['Error getting all menu items'], undefined);
    } else if (error.request) {
      console.error("Error request:", error.request);
      return new Output(false, [], ['Error getting all menu items'], undefined);
    }
    console.error("Error message:", error.message);
    console.error('Error getting all menu items:', error);
    return new Output(false, [], ['Error getting all menu items'], undefined);
  }
};