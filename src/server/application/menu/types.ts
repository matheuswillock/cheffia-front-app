export interface OutputCategory {
  id: string;
  name: string;
}

export interface OutputMenuItem {
  id: string;
  name: string;
  description: string;
  ingredients: string[];
  price: number;
  mediaId: string | null;
  mediaUrl: string | null;
  mediaImgixUrl: string | null;
  menuId: string;
  category: OutputCategory | null;
}

export interface OutputMenu {
  id: string;
  restaurantId: string;
  categories: OutputCategory[];
  items: OutputMenuItem[];
}

export interface MenuLiveItemOutput {
  id: string;
  name: string;
  description: string;
  ingredients: string[];
  price: number;
  mediaId: string | null;
  mediaUrl: string | null;
  mediaImgixUrl: string | null;
}

export interface GroupedMenuItemsByCategoryOutput {
  id: string | null;
  name: string | null;
  menuItems: MenuLiveItemOutput[];
}

export interface MenuLiveOutput {
  id: string;
  restaurantId: string;
  menuByCategories: GroupedMenuItemsByCategoryOutput[];
}

export interface AddMenuItemInput {
  restaurantId: string;
  item: {
    name: string;
    description: string;
    price: number;
    ingredients: string[];
    categoryId: string | null;
    itemMedia:
      | {
          name: string;
          contentType: string;
          size: number;
        }
      | null;
  };
}
