import { Output } from "@/models/Output";
import { RegisterRestaurantFormData } from "@/types/formTypes";
import { OutputRegisterRestaurant } from "@/models/dtos/OutputRegisterRestaurant";
import { InputToRegisterRestaurant } from "@/models/dtos/InputToRegisterRestaurant";
import { getRestaurantById, registerRestaurant } from "@/externalServices/restaurantService";
import { OutputGetRestaurantById } from "@/models/dtos/OutputGetRestaurantById";

// TODO: Add infos completas de endereço: cep, cidade, estado, bairro, complemento;
export const handleRegisterRestaurant = async (data: RegisterRestaurantFormData): Promise<OutputRegisterRestaurant> => {
  try {
    data.document = data.document.replace(/[^0-9]/g, "");
    data.phoneNumber = data.phoneNumber.replace(/[^0-9]/g, "");

    const output = await registerRestaurant(InputToRegisterRestaurant.fromFormData(data));

    if (!output.isValid) {
      throw new Error('Erro ao cadastrar restaurante');
    }
    
    return OutputRegisterRestaurant.fromOutputResult(output);
  } catch (error) {
    console.error('Error registering restaurant:', error);
    throw error;
  }
};

export const handleGetRestaurantById = async (id: string): Promise<OutputGetRestaurantById> => {
  try {
    const response = await getRestaurantById(id);

    // TODO: Criar tipos de erros para quando não encontrar o restaurante, não puder cadastrar um restaurante já cadastrado;
    if (!response.isValid) {
      throw new Error('Erro ao buscar restaurante');
    }

    return OutputGetRestaurantById.fromOutputResult(response);
  } catch (error) {
    console.error('Error getting restaurant:', error);
    throw error;
  }
}