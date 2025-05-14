import { unauthorized } from "@/lib/utils";
import { redirect } from "next/navigation";
import useWebSocket from "@/hooks/useWebSocket";
import { RegisterRestaurantFormData } from "@/types/formTypes";
import { getRestaurantById, registerRestaurant } from "@/api/restaurant";
import {verifySessionClient, createClient} from "@/utils/supabase/client";
import { InputToRegisterRestaurant } from "@/models/dtos/input/InputToRegisterRestaurant";
import { json } from "stream/consumers";
import { OutputGetRestaurantById } from "@/models/dtos/output/Restaurant/OutputGetRestaurantById";
import { OutputRegisterRestaurant } from "@/models/dtos/output/Restaurant/OutputRegisterRestaurant";

const API_URL_WEBSOCKET = process.env.NEXT_PUBLIC_API_URL_WEBSOCKET

// TODO: Add infos completas de endereço: cep, cidade, estado, bairro, complemento;
export const handleRegisterRestaurant = async (data: RegisterRestaurantFormData): Promise<OutputRegisterRestaurant> => {
  try {
    data.document = data.document.replace(/[^0-9]/g, "");
    data.phoneNumber = data.phoneNumber.replace(/[^0-9]/g, "");

    const response = await registerRestaurant(InputToRegisterRestaurant.fromFormData(data));

    if (!response.isValid) throw new Error('Erro ao cadastrar restaurante');

    var output = OutputRegisterRestaurant.fromOutputResult(response);

    console.log('output', output);
    console.log('output', JSON.stringify(output, null, 2));
    
    return output;
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
    // TODO: Redirect to error page;
    // redirect('/error');
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