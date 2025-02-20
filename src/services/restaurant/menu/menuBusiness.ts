import { InputToAddMenuItem } from "@/models/dtos/InputToAddMenuItem";
import { MenuItem } from "@/models/menuModels/MenuItem";
import { Output } from "@/models/Output";
import { AddMenuItemToMenu, DeleteMenuItem, GetAllMenuItems } from "@/externalServices/menuService";
import { AddMenuItemData } from "@/types/formTypes";

export const handleAddMenuItem = async (data: AddMenuItemData): Promise<Output> => {
  try {
    const input = InputToAddMenuItem.fromFormData(data);
    const response = await AddMenuItemToMenu(input.Item, input.Item.itemMedia, input.restaurantId);
    return response;
  } catch (error) {
    console.error('Error adding menu item:', error);
    throw error;
  }
}

export const handleGetAllMenuItems = async (restaurantId: string): Promise<MenuItem[]> => {
  try {
    const output = await GetAllMenuItems(restaurantId);
    
    if (output.isValid && output.result) {
      return output.result.items as MenuItem[];
    }    

    return [];
  } catch (error) {
    console.error('Error getting all menu items:', error);
    throw error;
  }
}

export const handleDeleteMenuItem = async (itemId: string): Promise<Output> => {
  try {
    const response = await DeleteMenuItem(itemId);
    return response;
  } catch (error) {
    console.error('Error deleting menu item:', error);
    throw error;
  }
}