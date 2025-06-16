import { GetMenuByRestaurantIdAndTableNumber } from "@/api/menuLive";
import { MenuLiveOutput } from "@/models/dtos/output/MenuLive/MenuLiveOutput";

export const HandleGetMenuLive = async (restaurantId: string|null, tableNumber: string|null): Promise<MenuLiveOutput> => {
  try {
    console.log('HandleGetMenuLive');

    if (!restaurantId || !tableNumber) {
      console.error('Restaurant ID and Table Number are required');
      return new MenuLiveOutput('', '', []);
    }

    const response = await GetMenuByRestaurantIdAndTableNumber(restaurantId, tableNumber);

    if (!response.isValid) {
      console.error('Error getting all menu items:', response.errorMessages);
      return new MenuLiveOutput('', '', []);
    }

    var result = response.result;

    return new MenuLiveOutput(result.id, result.restaurantId, result.menuByCategories);
  } catch (error) {
    console.error('error', error);
    throw error;
  }
}
