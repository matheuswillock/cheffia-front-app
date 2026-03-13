import {
  handleConfirmPixPayment,
  handleCreatePaymentIntent,
  type PixPaymentConfirmationOutput,
} from "@/business/payments/paymentsBusiness";
import type { CreatePixIntentInput } from "@/api/payment";
import type { OutputCreateIntent } from "@/models/dtos/output/OutputCreateIntent";

export const createCheckoutPixCharge = async (
  input: CreatePixIntentInput
): Promise<OutputCreateIntent> => handleCreatePaymentIntent(input);

export const confirmCheckoutPixCharge = async (
  paymentPixId: string
): Promise<PixPaymentConfirmationOutput> => handleConfirmPixPayment(paymentPixId);
