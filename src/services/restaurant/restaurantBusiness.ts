import { InputToRegisterRestaurant } from "@/models/dtos/InputToRegisterRestaurant";
import { Output } from "@/models/Output";
import { registerRestaurant } from "@/externalServices/restaurantService";
import { RegisterRestaurantFormData } from "@/types/formTypes";

export const handleRegisterRestaurant = async (data: RegisterRestaurantFormData): Promise<Output> => {
  try {
    data.document = data.document.replace(/[^0-9]/g, "");
    data.phoneNumber = data.phoneNumber.replace(/[^0-9]/g, "");

    console.log('data:', data);
    console.log('InputToRegisterRestaurant.fromFormData(data):', InputToRegisterRestaurant.fromFormData(data));

    const response = await registerRestaurant(InputToRegisterRestaurant.fromFormData(data));
    return response;
  } catch (error) {
    console.error('Error registering restaurant:', error);
    throw error;
  }
};

// TODO: Add get Restaurant by id;
export const getRestaurantById = async (id
: string): Promise<Output> => {
  try {
    const response = await getRestaurantById(id);
    return response;
  } catch (error) {
    console.error('Error getting restaurant:', error);
    throw error;
  }
}