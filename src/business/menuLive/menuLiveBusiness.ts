import { GetMenuByRestaurantIdAndTableNumber } from "@/api/menuLive";
import { MenuLiveOutput } from "@/models/dtos/output/MenuLive/MenuLiveOutput";

export const HandleGetMenuLive = async (): Promise<MenuLiveOutput> => {
  try {
    console.log('HandleGetMenuLive');

    const response = await GetMenuByRestaurantIdAndTableNumber();

    console.log('response', JSON.stringify(response, null, 2));

    console.log('response.result', JSON.stringify(response.result, null, 2));
    console.log('response.result.id', response.result.id);
    console.log('response.result.restaurantId', response.result.restaurantId);
    console.log('response.result.menuByCategories', JSON.stringify(response.result.menuByCategories, null, 2));

    var result = response.result;

    return new MenuLiveOutput(result.id, result.restaurantId, result.menuByCategories);
  } catch (error) {
    console.error('error', error);
    throw error;
  }
}
