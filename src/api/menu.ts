import { api } from "./config";
import { Output } from "@/models/Output";
import { MenuRoutes } from "./routes/menu";
import { InputItem } from "@/models/dtos/input/InputToAddMenuItem";

export const AddMenuItemToMenu = async (input: InputItem, media: File , restaurantId: string) => {
  try {
    const response = await api.post(
      MenuRoutes.add,
      setupFormData(input, media, restaurantId), {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    )

    return response.data;
  } catch (error) {
    console.error('Error adding item to menu:', error);
    throw error;
  }
};

export const GetAllMenuItems = async (restaurantId: string): Promise<Output> => {
  try {
    const response = await api.post(
      MenuRoutes.allMenuItems, {
        params: {
          restaurantId
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error getting all menu items:', error);
    return new Output(false, [], ['Error getting all menu items'], undefined);
  }
};

export const DeleteMenuItem = async (itemId: string): Promise<Output> => {
  try {
    const response = await api.delete(
      MenuRoutes.deleteItem, {
        params: { itemId }
      }
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