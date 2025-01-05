import { registerRestaurant } from "@/services/resturantService";
import { FormData } from "@/types/formTypes";
import { InputToRegisterRestaurant } from "@/models/InputToRegisterRestaurant";

export const handleRegisterRestaurant = async (data: FormData) => {
  try {
    data.document = data.document.replace(/[^0-9]/g, "");
    data.phoneNumber = data.phoneNumber.replace(/[^0-9]/g, "");

    const formattedData = InputToRegisterRestaurant.fromFormData(data);

    const response = await registerRestaurant(formattedData);
    return response;
  } catch (error) {
    console.error('Error registering restaurant:', error);
    throw error;
  }
};