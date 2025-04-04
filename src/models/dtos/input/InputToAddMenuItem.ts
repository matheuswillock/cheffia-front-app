import { AddMenuItemData } from "@/types/formTypes";

export class InputItem {
  name: string ;
  description: string ;
  price: number ;
  ingredients: string[] ;
  itemMedia: File;

  constructor(
    description: string,
    name: string,
    price: number,
    ingredients: string[],
    itemMedia: File,
  ) {
    this.description = description;
    this.name = name;
    this.price = price;
    this.ingredients = ingredients;
    this.itemMedia = itemMedia;
  }
}

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
      data.itemMedia
    );

    return new InputToAddMenuItem(
      inputItem,
      data.restaurantId
    );
  }
}