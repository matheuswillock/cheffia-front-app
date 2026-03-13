import type {
  InputPaymentPayer,
  PaymentOrderOutput,
} from "@/server/application/orderhub/types";

export interface CreatePaymentIntentInput {
  customerOrderId: string;
  payTip: boolean;
  payer: InputPaymentPayer;
}

export interface CreateProductInput {
  productName: string;
  productDescription: string;
  price: number;
  currency: string;
}

export type PaymentIntentOutput = PaymentOrderOutput;

export interface PaymentProductOutput {
  code: "stripe_removed";
  message: string;
}
