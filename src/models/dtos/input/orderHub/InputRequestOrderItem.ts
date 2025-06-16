export class InputRequestOrderItem {
  menuItemId: string;
  quantity: number;
  MenuItemId: string;
  Comments: string;
  price: number;

  constructor(
    menuItemId: string,
    quantity: number,
    MenuItemId: string,
    Comments: string,
    price: number
  ) {
    this.menuItemId = menuItemId;
    this.quantity = quantity;
    this.MenuItemId = MenuItemId;
    this.Comments = Comments;
    this.price = price;
  }
}