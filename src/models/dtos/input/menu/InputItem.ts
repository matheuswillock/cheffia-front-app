export class InputItem {
  name: string ;
  description: string ;
  price: number ;
  ingredients: string[];
  itemMedia: File | undefined;
  categoryId: string;

  constructor(
    description: string,
    name: string,
    price: number,
    ingredients: string[],
    itemMedia: File | undefined,
    categoryId: string
  ) {
    this.description = description;
    this.name = name;
    this.price = price;
    this.ingredients = ingredients;
    this.itemMedia = itemMedia;
    this.categoryId = categoryId;
  }
}
