import {
  confirmPixPayment,
  createIntent,
  type CreatePixIntentInput,
} from "@/api/payment";
import { OutputCreateIntent } from "@/models/dtos/output/OutputCreateIntent";

export interface PixPaymentConfirmationOutput {
  status: string;
  confirmationAt: string;
}

export const handleCreatePaymentIntent = async (
  input: CreatePixIntentInput
): Promise<OutputCreateIntent> => {
  const response = await createIntent(input);

  if (!response.isValid) {
    throw new Error(response.errorMessages[0] ?? "Erro ao criar cobranca PIX");
  }

  return OutputCreateIntent.fromOutputResult(response);
};

export const handleConfirmPixPayment = async (
  paymentPixId: string
): Promise<PixPaymentConfirmationOutput> => {
  const response = await confirmPixPayment(paymentPixId);

  if (!response.isValid) {
    throw new Error(response.errorMessages[0] ?? "Erro ao confirmar pagamento PIX");
  }

  return {
    status: response.result.status,
    confirmationAt: response.result.confirmationAt,
  };
};
