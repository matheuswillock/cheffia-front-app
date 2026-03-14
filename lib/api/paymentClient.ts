import { confirmPixPayment, createIntent, type CreatePixIntentInput } from "@/lib/api/payment";
import { OutputCreateIntent } from "@/models/dtos/output/OutputCreateIntent";

export interface PixPaymentConfirmationOutput {
  status: string;
  confirmationAt: string;
}

export const createCheckoutPixCharge = async (
  input: CreatePixIntentInput
): Promise<OutputCreateIntent> => {
  const response = await createIntent(input);

  if (!response.isValid) {
    throw new Error(response.errorMessages[0] ?? "Erro ao criar cobranca PIX");
  }

  return OutputCreateIntent.fromOutputResult(response);
};

export const confirmCheckoutPixCharge = async (
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
