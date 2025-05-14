import { cheffiaApiConfig } from "@/api/config/cheffiaApiConfig";
import { Output } from "@/models/Output";
import { MenuRoutes } from '@/api/routes/routesConfig';
import { InputItem } from "@/models/dtos/input/InputToAddMenuItem";

export const AddMenuItemToMenu = async (input: InputItem, media: File , restaurantId: string) => {
  try {
    console.log('input', input);
    console.log('media', JSON.stringify(setupFormData(input, media, restaurantId), null, 2));

    const response = await cheffiaApiConfig.post(
      MenuRoutes.add,
      setupFormData(input, media, restaurantId), {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    )

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

export const GetAllMenuItems = async (restaurantId: string): Promise<Output> => {
  try {
    const response = await cheffiaApiConfig.get(
      MenuRoutes.allMenuItems, {
        params: {
          restaurantId
        }
      }
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

export const DeleteMenuItem = async (itemId: string): Promise<Output> => {
  try {

    const response = await cheffiaApiConfig.delete(
      `${MenuRoutes.deleteItem}/${itemId}`
    );

    return response.data;
  } catch (error) {
    console.error('Error deleting item from menu:', error);
    throw error;
  }
}

const setupFormData = (input: InputItem, media: File , restaurantId: string) => {
  const formData = new FormData();
  formData.append('Item.Name', input.name);
  formData.append('Item.Description', input.description);
  formData.append('Item.Price', input.price.toString());
  formData.append('Item.Ingredients', JSON.stringify(input.ingredients));
  formData.append('Item.ItemMedia', media);
  formData.append('RestaurantId', restaurantId);

  return formData;
}