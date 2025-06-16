import { InputRequestOrderItem } from "./InputRequestOrderItem";

export class InputRequestOrder {
  OrderId: string | undefined;
  restaurantId: string;
  TableNumber: string;
  TotalPrice: number;
  OrderItems: InputRequestOrderItem[];

  constructor(
    OrderId: string | undefined,
    restaurantId: string,
    TableNumber: string,
    TotalPrice: number,
    OrderItems: InputRequestOrderItem[]
  ) {
    this.OrderId = OrderId;
    this.restaurantId = restaurantId;
    this.TableNumber = TableNumber;
    this.TotalPrice = TotalPrice;
    this.OrderItems = OrderItems;
  }
}