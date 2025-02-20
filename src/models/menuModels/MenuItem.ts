export class MenuItem {
  id: string;
  name: string;
  description: string;
  ingredients: string[];
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
    this.menuId = menuId;
    this.price = price;
    this.mediaId = mediaId;
    this.mediaUrl = mediaUrl;
    this.mediaImgixUrl = mediaImgixUrl;
  }

}