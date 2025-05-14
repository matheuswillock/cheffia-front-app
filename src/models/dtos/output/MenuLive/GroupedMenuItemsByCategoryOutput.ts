import { MenuLiveItemOutput } from "./MenuLiveItemOutput"

export class GroupedMenuItemsByCategoryOutput {
  id: string;
  name: string;
  menuItems: MenuLiveItemOutput[]

  constructor(id: string | null, name: string | null, menuItems: MenuLiveItemOutput[] | null) {
    this.id = id || '';
    this.name = name || '';
    this.menuItems = menuItems || [];
  }
};