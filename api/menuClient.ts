import { AddMenuItemToMenu, DeleteMenuItem, GetAllMenuItems } from "@/api/menu";
import { InputToAddMenuItem } from "@/models/dtos/input/InputToAddMenuItem";
import type { Output } from "@/models/Output";
import type { MenuItem } from "@/models/menuModels/MenuItem";
import type { AddMenuItemData } from "@/types/formTypes";

export const addMenuItem = async (data: AddMenuItemData): Promise<Output> => {
  const input = InputToAddMenuItem.fromFormData(data);
  return AddMenuItemToMenu(input.Item, input.Item.itemMedia, input.restaurantId);
};

export const getMenuItems = async (restaurantId: string): Promise<MenuItem[]> => {
  const output = await GetAllMenuItems(restaurantId);

  if (output.isValid && output.result) {
    return output.result.items as MenuItem[];
  }

  return [];
};

export const deleteMenuItem = async (itemId: string): Promise<Output> => {
  return DeleteMenuItem(itemId);
};
