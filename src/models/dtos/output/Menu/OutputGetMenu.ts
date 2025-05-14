import { Category } from '@/models/menuModels/Category';
import { MenuItem } from '@/models/menuModels/MenuItem';

export class OutputGetMenu {
  id: string;
  restaurantId: string;
  categories: Category[];
  items: MenuItem[];

  constructor(id: string | null, restaurantId: string | null, categories: Category[] | null, items: MenuItem[] | null) {
    this.id = id  || '';
    this.restaurantId = restaurantId || '';
    this.categories = categories || [];
    this.items = items || [];
  }

};