import { Output } from "@/models/Output";
import Placeholder from "@/assets/placeholder.svg";
import { AddMenuItemData } from "@/types/formTypes";
import { MenuItem } from "@/models/menuModels/MenuItem";
import { AddMenuItemToMenu, DeleteMenuItem, GetAllMenuItems } from "@/api/menu";
import { OutputGetMenu } from "@/models/dtos/output/Menu/OutputGetMenu";
import { OutputDeleteMenu } from "@/models/dtos/output/Menu/outputDeleteMenu";
import { InputToAddMenuItem } from "@/models/dtos/input/menu/InputToAddMenuItem";

export const handleAddMenuItem = async (data: AddMenuItemData): Promise<Output> => {
  try {
    const input = InputToAddMenuItem.fromFormData(data);
    console.log('handleAddMenuItem - input', input);
    const response = await AddMenuItemToMenu(input.Item, input.Item.itemMedia, input.restaurantId);
    return response;
  } catch (error) {
    console.error('Error adding menu item:', error);
    throw error;
  }
}

export const handleGetAllMenuItems = async (restaurantId: string): Promise<OutputGetMenu> => {
  try {
    const output = await GetAllMenuItems(restaurantId);

    console.log('handleGetAllMenuItems - output', output);
    console.log('handleGetAllMenuItems - output.result', JSON.stringify(output.result, null, 2));
    console.log('handleGetAllMenuItems - output.result.id', output.result.id);
    console.log('handleGetAllMenuItems - output.result.restaurantId', output.result.restaurantId);
    console.log('handleGetAllMenuItems - output.result.items', JSON.stringify(output.result.items, null, 2));
    console.log('handleGetAllMenuItems - output.result.categories', JSON.stringify(output.result.categories, null, 2));

    if (!output.isValid && !output.result && !output.result.items) {
      return new OutputGetMenu(null, null, null, null);
    }

    var result = output.result;
    var response = new OutputGetMenu(result.id, result.restaurantId, result.categories, result.items);
    console.log('handleGetAllMenuItems - response', JSON.stringify(response, null, 2));
    return response;

  } catch (error) {
    console.error('Error getting all menu items:', error);
    throw error;
  }
}

export const handleDeleteMenuItem = async (itemId: string): Promise<OutputDeleteMenu> => {
  try {
    const response = await DeleteMenuItem(itemId);

    if (!response.isValid) {
      console.error('Error deleting menu item:', response.errorMessages);
    }

    return new OutputDeleteMenu(response.isValid);
  } catch (error) {
    console.error('Error deleting menu item:', error);
    throw error;
  }
}
