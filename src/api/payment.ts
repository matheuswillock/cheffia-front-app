import { api } from './config';
import { Output } from '@/models/Output';
import { paymentRoutes } from './routes/payment';

export const createIntent = async (): Promise<Output> => {
  try {

    const data = {
      amount: 100.00,
      currency: "brl"
    }

    console.log('Creating payment intent...');
    console.log('Request to create payment intent:', data);
    console.log('Request URL:', paymentRoutes.createItent);
    const response = await api.post(
      paymentRoutes.createItent,
      data,
    )

    console.log(response.data)
    return response.data;
  } catch (error: any) {
    // TODO: Criar tipos de erros para mapear quando não encontrar o restaurante e quaisquer outros erros no BACKEND e/ou FRONTEND;
    if (error.isAxiosError && error.response?.status === 400) {
      return new Output(
        false,
        [],
        [error.message],
        error
      );
    }
    throw error;
  }
};

export const createProduct = async (): Promise<Output> => {
  try {

    const data = {
      productName: "string",
      productDescription: "string",
      price: 100,
      currency: "brl"
    }

    const response = await api.post(
      paymentRoutes.createProduct,
      data,
    )

    return response.data;
  } catch (error: any) {
    // TODO: Criar tipos de erros para mapear quando não encontrar o restaurante e quaisquer outros erros no BACKEND e/ou FRONTEND;
    if (error.isAxiosError && error.response?.status === 400) {
      return new Output(
        false,
        [],
        [error.message],
        error
      );
    }
    throw error;
  }
};