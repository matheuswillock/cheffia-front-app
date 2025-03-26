import { InputToRegisterRestaurant } from '@/models/dtos/InputToRegisterRestaurant';
import { Output } from '@/models/Output';
import { api } from './config';
import { restaurantRoutes } from './routes/restaurant';
import { headers } from 'next/headers';


export const registerRestaurant = async (data: InputToRegisterRestaurant): Promise<Output> => {
  try {
    const response = await api.post(
      restaurantRoutes.registerRestaurant,
      data,
    )

    return response.data;
  } catch (error) {
    console.error('Error registering restaurant:', error);
    throw error;
  }
};

export const getRestaurantById = async (id: string): Promise<Output> => {
  try {
    const response = await api.get(
      restaurantRoutes.getRestaurant(id)
    )

    return Output.fromOutputResult(response.data);
  } catch (error: any) {
    // TODO: Criar tipos de erros para mapear quando não encontrar o restaurante e quaisquer outros erros no BACKEND e/ou FRONTEND;
    if (error.isAxiosError && error.response?.status === 400) {
      return Output.fromOutputResult(new Output(
        false, 
        [], 
        [error.message], 
        error
      ));
    }
    throw error;
  }
};