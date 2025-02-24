import { Output } from "@/models/Output";
import { RegisterRestaurantFormData } from "@/types/formTypes";
import { OutputRegisterRestaurant } from "@/models/dtos/OutputRegisterRestaurant";
import { InputToRegisterRestaurant } from "@/models/dtos/InputToRegisterRestaurant";
import { getRestaurantById, registerRestaurant } from "@/externalServices/restaurantService";

// TODO: Add infos completas de endereço: cep, cidade, estado, bairro, complemento;
export const handleRegisterRestaurant = async (data: RegisterRestaurantFormData): Promise<OutputRegisterRestaurant> => {
  try {
    data.document = data.document.replace(/[^0-9]/g, "");
    data.phoneNumber = data.phoneNumber.replace(/[^0-9]/g, "");

    const response = await registerRestaurant(InputToRegisterRestaurant.fromFormData(data));
    
    return OutputRegisterRestaurant.fromOutputResult(response);
  } catch (error) {
    console.error('Error registering restaurant:', error);
    throw error;
  }
};

export const handleGetRestaurantById = async (id: string): Promise<Output> => {
  try {
    const response = await getRestaurantById(id);
    return response;
  } catch (error) {
    console.error('Error getting restaurant:', error);
    throw error;
  }
}