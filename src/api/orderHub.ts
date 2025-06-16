import { cheffiaApiConfig } from "./config/cheffiaApiConfig";
import { orderRoutes } from "./routes/routesConfig";

export const SendOrderToKitchenAPI = async (data: any): Promise<any> => {
  try {
    const response = await cheffiaApiConfig.post(
      orderRoutes.sendOrderToKitchen,
      data,
    );

    return response.data;
  } catch (error) {
    console.error('Error sending order to kitchen:', error);
    throw error;
  }
}