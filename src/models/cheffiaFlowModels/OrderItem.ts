import { orderItemStatus } from './enums/orderItemStatus';

export class OrderItem{
  orderNumber: number;
  itemName: string;
  quantity: number;
  comments: string;
  tableNumber: string;
  price: number;
  dispatchDate: Date;
  orderItemStatus: orderItemStatus;

  constructor(
    orderNumber: number,
    itemName: string,
    quantity: number,
    comments: string,
    tableNumber: string,
    dispatchDate: Date,
    price: number,
    orderItemStatus: orderItemStatus
  ) {
    this.orderNumber = orderNumber;
    this.itemName = itemName;
    this.quantity = quantity;
    this.comments = comments;
    this.tableNumber = tableNumber;
    this.dispatchDate = dispatchDate;
    this.price = price;
    this.orderItemStatus = orderItemStatus;
  }
}