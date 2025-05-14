import { GroupedMenuItemsByCategoryOutput } from "./GroupedMenuItemsByCategoryOutput";

export class MenuLiveOutput {
  id: string;
  restaurantId: string;
  menuByCategories: GroupedMenuItemsByCategoryOutput[];

  constructor(id: string | null, restaurantId: string | null, menuByCategories: GroupedMenuItemsByCategoryOutput[] | null) {
    this.id = id  || '';
    this.restaurantId = restaurantId || '';
    this.menuByCategories = menuByCategories || [];
  }
};