import { CartItem } from "@/hooks/cartHooks/CartItem";
import { InputRequestOrderItem } from "./InputRequestOrderItem";

export class InputRequestOrder {
  restaurantId: string;
  tableNumber: string;
  totalPrice: number;
  orderItems: InputRequestOrderItem[];

  constructor(
    restaurantId: string,
    tableNumber: string,
    totalPrice: number,
    orderItems: InputRequestOrderItem[]
  ) {
    this.restaurantId = restaurantId;
    this.tableNumber = tableNumber;
    this.totalPrice = totalPrice;
    this.orderItems = orderItems;
  }

  static ToInput(cartItem: CartItem[], tableNumber: string, restaurantId: string, orderId: string | null): InputRequestOrder {
    return new InputRequestOrder(
      restaurantId,
      tableNumber,
      cartItem.reduce((acc, item) => acc + item.price * item.quantity, 0),
      cartItem.map((item) =>
        new InputRequestOrderItem(item.id, item.name, item.quantity, item.comments ?? "", orderId)
      )
    );
  }
}