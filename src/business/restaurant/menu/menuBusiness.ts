import { InputToAddMenuItem } from "@/models/dtos/InputToAddMenuItem";
import { Output } from "@/models/Output";
import { AddMenuItemToMenu } from "@/services/menuService";
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