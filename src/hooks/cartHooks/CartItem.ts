import { MenuLiveItemOutput } from "@/models/dtos/output/MenuLive/MenuLiveItemOutput";

export class CartItem {
  id: string;
  orderId: string | null;
  name: string;
  description: string;
  ingredients: string[];
  price: number;
  comments: string | null;
  quantity: number;

  constructor(
    id: string,
    orderId: string | null,
    name: string,
    description: string,
    ingredients: string[],
    price: number,
    comments: string | null,
    quantity: number
  ) {
    this.id = id;
    this.orderId = orderId;
    this.name = name;
    this.description = description;
    this.ingredients = ingredients;
    this.price = price;
    this.comments = comments;
    this.quantity = quantity;
  }

  static FromMenuLiveItem(item: MenuLiveItemOutput, quantity: number, comments: string | null, orderId: string | null): CartItem {
    return new CartItem(
      item.id,
      orderId,
      item.name,
      item.description,
      item.ingredients,
      item.price,
      comments,
      quantity
    );
  }
}