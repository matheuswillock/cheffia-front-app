export interface InputRequestOrderItem {
  menuItemId: string;
  quantity: number;
  comments: string;
  tableNumber: string;
  orderStatus?: string | null;
}

export interface InputRequestOrder {
  customerOrderId?: string | null;
  restaurantId: string;
  tableNumber: string;
  orderItems: InputRequestOrderItem[];
}

export interface InputPaymentOrder {
  customerOrderId: string;
  payTip: boolean;
}

export interface InputConfirmPayment {
  paymentPixId: string;
}

export interface OrderItemOutput {
  itemName: string;
  price: number;
  quantity: number;
  comments: string;
  tableNumber: string;
  orderNumber: number;
}

export interface SendOrderOutput {
  customerOrderId: string;
  restaurantId: string;
  orderDate: string;
  orderItems: OrderItemOutput[];
}

export interface OrderOutput extends SendOrderOutput {
  totalToPay: number;
  tableNumber: string;
  orderNumber: number;
}

export interface PaymentOrderOutput {
  error: null;
  data: {
    amount: number;
    status: string;
    method: string;
    brCode: string | null;
    brCodeBase64: string | null;
    platformFee: number;
    description: string;
    createdAt: string;
    updatedAt: string;
    expiresAt: string | null;
    id: string;
  };
}

export interface OutputConfirmPaymentStatus {
  status: string;
  confirmationAt: string;
}
