import { AddMenuItemData } from "@/types/formTypes";
import { InputItem } from "./InputItem";

export class InputToAddMenuItem {
  Item: InputItem;
  restaurantId: string;

  constructor(
    item: InputItem,
    restaurantId: string,
  ) {
    this.Item = item;
    this.restaurantId = restaurantId;
  }

  static fromFormData(data: AddMenuItemData) {
    const inputItem = new InputItem(
      data.description,
      data.name,
      data.price,
      data.ingredients,
      data.itemMedia,
      data.category
    );

    return new InputToAddMenuItem(
      inputItem,
      data.restaurantId
    );
  }
}