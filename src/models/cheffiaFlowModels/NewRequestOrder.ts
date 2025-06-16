import { PaymentStatus } from "@/models/cheffiaFlowModels/enums/paymentStatus";
import { OrderItem } from "./OrderItem";

export class NewRequestOrder {
  customerOrderId: string;
  restaurantId: string;
  orderDate: Date;
  paymentStatus: PaymentStatus;
  totalToPay: number;
  orderItems: OrderItem[];
  tableNumber: string;
  orderStatus: string;
  orderNumber: number;

  constructor(
    customerOrderId: string,
    restaurantId: string,
    orderDate: Date,
    paymentStatus: PaymentStatus,
    totalToPay: number,
    orderItems: OrderItem[],
    tableNumber: string,
    orderStatus: string,
    orderNumber: number
  ) {
    this.customerOrderId = customerOrderId;
    this.restaurantId = restaurantId;
    this.orderDate = orderDate;
    this.paymentStatus = paymentStatus;
    this.totalToPay = totalToPay;
    this.orderItems = orderItems;
    this.tableNumber = tableNumber;
    this.orderStatus = orderStatus;
    this.orderNumber = orderNumber;
  }
}