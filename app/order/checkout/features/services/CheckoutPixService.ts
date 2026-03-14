import {
  confirmCheckoutPixCharge as confirmCheckoutPixChargeRequest,
  createCheckoutPixCharge as createCheckoutPixChargeRequest,
  type PixPaymentConfirmationOutput,
} from "@/lib/api/paymentClient";
import type { CreatePixIntentInput } from "@/lib/api/payment";
import type { OutputCreateIntent } from "@/models/dtos/output/OutputCreateIntent";

export const createCheckoutPixCharge = async (
  input: CreatePixIntentInput
): Promise<OutputCreateIntent> => createCheckoutPixChargeRequest(input);

export const confirmCheckoutPixCharge = async (
  paymentPixId: string
): Promise<PixPaymentConfirmationOutput> => confirmCheckoutPixChargeRequest(paymentPixId);
