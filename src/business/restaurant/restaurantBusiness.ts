import { registerRestaurant } from "@/services/resturantService";
import { FormData } from "@/types/formTypes";

export const handleRegisterRestaurant = async (data: FormData) => {
  try {
    // Limpar e formatar dados conforme necessário
    data.document = data.document.replace(/[^0-9]/g, "");
    data.phoneNumber = data.phoneNumber.replace(/[^0-9]/g, "");

    // Chamar o serviço de API para registrar o restaurante
    const response = await registerRestaurant(data);
    return response;
  } catch (error) {
    console.error('Error registering restaurant:', error);
    throw error;
  }
};