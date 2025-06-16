export class InputEventToSend {
  RestaurantId: string;
  EventName: string;
  PayloadJson: string | null;

  constructor(restaurantId: string, eventName: string, payloadJson: string | null = null) {
    this.RestaurantId = restaurantId;
    this.EventName = eventName;
    this.PayloadJson = payloadJson;
  }
}