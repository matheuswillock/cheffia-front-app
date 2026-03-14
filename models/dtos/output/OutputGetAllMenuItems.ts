import { MenuItem } from "@/models/menuModels/MenuItem";
import { Output } from "@/models/Output";

interface MenuResult {
  id: string;
  restaurantId: string;
  restaurantKitchenId: string;
  items: MenuItem[];
}

export class OutputGetAllMenuItems extends Output {
  result: MenuResult;

  constructor(isValid: boolean, successMessages: string[], errorMessages: string[], result: MenuResult) {
    super(isValid, successMessages, errorMessages, result);
    this.result = result;
  }
}