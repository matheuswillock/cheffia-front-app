import { Category } from "./Category";

export class MenuItem {
  id: string;
  name: string;
  description: string;
  ingredients: string[];
  category: Category | null;
  menuId: string;
  price: number;
  mediaId: string | null;
  mediaUrl: string | null;
  mediaImgixUrl: string | null;

  constructor(
    id: string,
    name: string,
    description: string,
    ingredients: string[],
    category: Category | null,
    menuId: string,
    price: number,
    mediaId: string | null,
    mediaUrl: string | null,
    mediaImgixUrl: string | null,
  ) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.ingredients = ingredients;
    this.category = category;
    this.menuId = menuId;
    this.price = price;
    this.mediaId = mediaId;
    this.mediaUrl = mediaUrl;
    this.mediaImgixUrl = mediaImgixUrl;
  }

  static fromOutputResult(output: any): MenuItem {
    return new MenuItem(
      output.id,
      output.name,
      output.description,
      output.ingredients,
      output.category && new Category(output.category.id, output.category.name),
      output.menuId,
      output.price,
      output.mediaId,
      output.mediaUrl,
      output.mediaImgixUrl
    );
  }

}