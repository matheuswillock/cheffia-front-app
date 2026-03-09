export interface CreatePaymentIntentInput {
  amount: number;
  currency: string;
}

export interface CreateProductInput {
  productName: string;
  productDescription: string;
  price: number;
  currency: string;
}

export interface PaymentIntentOutput {
  clientSecret: string | null;
}

export interface PaymentProductOutput {
  productId: string;
  priceId: string;
  productName: string;
  productDescription: string | null;
  price: number | null;
  currency: string;
  interval: string | null;
  intervalCount: number | null;
  createdAt: string;
  updatedAt: string;
  productUrl: string | null;
  productImage: string[];
}
