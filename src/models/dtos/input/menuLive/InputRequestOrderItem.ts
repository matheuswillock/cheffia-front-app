export class InputRequestOrderItem {
  menuItemId: string;
  menuItemName: string;
  quantity: number;
  comments: string;
  orderId: string | null;

  constructor(
    id: string,
    menuItemName: string,
    quantity: number,
    comments: string,
    orderId: string | null = null
  ) {
    this.menuItemId = id;
    this.menuItemName = menuItemName;
    this.quantity = quantity;
    this.comments = comments;
    this.orderId = orderId;
  }
}