import { InputToRegisterRestaurant } from "@/models/dtos/InputToRegisterRestaurant";
import { Output } from "@/models/Output";
import { registerRestaurant } from "@/externalServices/resturantService";
import { FormData } from "@/types/formTypes";


export const handleRegisterRestaurant = async (data: FormData): Promise<Output> => {
  try {
    data.document = data.document.replace(/[^0-9]/g, "");
    data.phoneNumber = data.phoneNumber.replace(/[^0-9]/g, "");

    const response = await registerRestaurant(InputToRegisterRestaurant.fromFormData(data));
    return response;
  } catch (error) {
    console.error('Error registering restaurant:', error);
    throw error;
  }
};