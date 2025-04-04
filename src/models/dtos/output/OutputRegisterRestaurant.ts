import { Output } from "@/models/Output";

export class OutputRegisterRestaurant {
  RestaurantId: string;

  constructor(restaurantId: string) {
    this.RestaurantId = restaurantId;
  }

  static fromOutputResult(output: Output): OutputRegisterRestaurant {
    return new OutputRegisterRestaurant(output.result.restaurantId);
  }
}