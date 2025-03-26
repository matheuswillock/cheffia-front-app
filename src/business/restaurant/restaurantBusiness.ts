import { unauthorized } from "@/lib/utils";
import { redirect } from "next/navigation";
import useWebSocket from "@/hooks/useWebSocket";
import { RegisterRestaurantFormData } from "@/types/formTypes";
import { getRestaurantById, registerRestaurant } from "@/api/restaurant";
import {verifySessionClient, createClient} from "@/utils/supabase/client";
import { OutputGetRestaurantById } from "@/models/dtos/output/OutputGetRestaurantById";
import { OutputRegisterRestaurant } from "@/models/dtos/output/OutputRegisterRestaurant";
import { InputToRegisterRestaurant } from "@/models/dtos/input/InputToRegisterRestaurant";

const API_URL_WEBSOCKET = process.env.NEXT_PUBLIC_API_URL_WEBSOCKET

// TODO: Add infos completas de endereço: cep, cidade, estado, bairro, complemento;
export const handleRegisterRestaurant = async (data: RegisterRestaurantFormData): Promise<OutputRegisterRestaurant> => {
  try {
    data.document = data.document.replace(/[^0-9]/g, "");
    data.phoneNumber = data.phoneNumber.replace(/[^0-9]/g, "");

    const output = await registerRestaurant(InputToRegisterRestaurant.fromFormData(data));

    if (!output.isValid) throw new Error('Erro ao cadastrar restaurante');
    
    return OutputRegisterRestaurant.fromOutputResult(output);
  } catch (error) {
    console.error('Error registering restaurant:', error);
    throw error;
  }
};

export const handleGetRestaurantById = async (id: string): Promise<OutputGetRestaurantById> => {
  try {

    const sessionIsValid = await verifySessionClient();

    if (!sessionIsValid) unauthorized();

    const response = await getRestaurantById(id);

    // TODO: Criar tipos de erros para quando não encontrar o restaurante, não puder cadastrar um restaurante já cadastrado;
    if (!response.isValid) redirect('/register/restaurant');

    return OutputGetRestaurantById.fromOutputResult(response);
  } catch (error) {
    console.error('Error getting restaurant:', error);
    throw error;
  }
}

export const useRestaurantWebSocket = (restaurantId: string) => {
  const { messages, sendMessage } = useWebSocket(`${API_URL_WEBSOCKET}/order-hub/connect/${restaurantId}/true`);

  return { messages, sendMessage };
}

export const handleLogout = async () => {
  const supabase = await createClient()
  const { error } = await supabase.auth.signOut()

  if (error) return redirect('/error')

  return redirect('/sign-in')
}