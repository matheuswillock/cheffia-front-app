import { cheffiaApiConfig } from "@/api/config/cheffiaApiConfig";
import { paymentRoutes } from "@/api/routes/routesConfig";
import { Output } from "@/models/Output";

export interface PaymentPayerInput {
  name: string;
  phoneNumber: string;
  email?: string | null;
  document?: string | null;
}

export interface CreatePixIntentInput {
  customerOrderId: string;
  payTip: boolean;
  payer: PaymentPayerInput;
}

export const createIntent = async (input: CreatePixIntentInput): Promise<Output> => {
  try {
    const response = await cheffiaApiConfig.post(paymentRoutes.createIntent, input);
    return Output.fromOutputResult(response.data);
  } catch (error: any) {
    if (error.isAxiosError && (error.response?.status === 400 || error.response?.status === 410)) {
      return Output.fromOutputResult(error.response.data);
    }
    throw error;
  }
};

export const confirmPixPayment = async (paymentPixId: string): Promise<Output> => {
  try {
    const response = await cheffiaApiConfig.post(paymentRoutes.confirmPixPayment, { paymentPixId });
    return Output.fromOutputResult(response.data);
  } catch (error: any) {
    if (error.isAxiosError && error.response?.status === 400) {
      return Output.fromOutputResult(error.response.data);
    }
    throw error;
  }
};

export const createProduct = async (): Promise<Output> => {
  try {
    const response = await cheffiaApiConfig.post(paymentRoutes.createProduct, {});
    return Output.fromOutputResult(response.data);
  } catch (error: any) {
    if (error.isAxiosError && (error.response?.status === 400 || error.response?.status === 410)) {
      return Output.fromOutputResult(error.response.data);
    }
    throw error;
  }
};
