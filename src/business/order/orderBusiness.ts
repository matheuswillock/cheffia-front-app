"use server"

import { SendOrderToKitchenAPI } from "@/api/orderHub";
import { CartItem } from "@/hooks/cartHooks/CartItem";
import { InputRequestOrder } from "@/models/dtos/input/menuLive/InputRequestOrder";


export const HandleSendOrderToKitchen = async (inputCart: CartItem[], restaurantId: string, tableNumber: string): Promise<void> => {
  try {
    console.log('HandleSendOrderToKitchen');
    console.log('InputCart', JSON.stringify(inputCart, null, 2));

    // Call the API to send the order to the kitchen
    const response = await SendOrderToKitchenAPI(
      InputRequestOrder.ToInput(inputCart, tableNumber, restaurantId, inputCart[0].orderId)
    );

    console.log('response', JSON.stringify(response, null, 2));

    if (!response.isValid) {
      console.error('Error sending order to kitchen:', response.errorMessages);
      throw new Error('Error sending order to kitchen');
    }

    console.log('Order sent to kitchen successfully');
  } catch (error) {
    console.error('error', error);
    throw error;
  }
}