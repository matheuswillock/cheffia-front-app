import { InputItem, InputToAddMenuItem } from "@/models/dtos/InputToAddMenuItem";
import { Output } from "@/models/Output";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const AddMenuItemToMenu = async (input: InputItem, media: File , restaurantId: string) => {
  try {
    const formData = new FormData();
    formData.append('Item.Name', input.name);
    formData.append('Item.Description', input.description);
    formData.append('Item.Price', input.price.toString());
    formData.append('Item.Ingredients', JSON.stringify(input.ingredients));
    formData.append('Item.ItemMedia', media);
    formData.append('RestaurantId', restaurantId);

    const response = await axios.post(`${API_URL}/api/v1/menus/items/add`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'accept': '*/*'
      }
    });

    console.log('MenuService - 22 | response', response);
    return response.data;
  } catch (error) {
    console.error('Error adding item to menu:', error);
    throw error;
  }
};

export const GetAllMenuItems = async (restaurantId: string): Promise<Output> => {
  try {
    const response = await axios.get(`${API_URL}/api/v1/menus/get`, {
      params: { restaurantId },
      headers: {
        'accept': '*/*'
      }
    });
    console.log(response);
    return response.data;
  } catch (error) {
    console.error('Error getting all menu items:', error);
    return new Output(false, [], ['Error getting all menu items'], undefined);
  }
};

export const DeleteMenuItem = async (itemId: string): Promise<Output> => {
  try {
    const response = await axios.delete(`${API_URL}/api/v1/menus/items/delete`, {
      params: { itemId },
      headers: {
        'accept': '*/*'
      }
    });

    console.log('MenuService - 22 | response', response);
    return response.data;
  } catch (error) {
    console.error('Error deleting item from menu:', error);
    throw error;
  }
}