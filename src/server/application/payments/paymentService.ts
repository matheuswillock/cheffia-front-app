import Stripe from "stripe";
import { failOutput, okOutput, type Output } from "@/server/shared/output";
import type {
  CreatePaymentIntentInput,
  CreateProductInput,
  PaymentIntentOutput,
  PaymentProductOutput,
} from "./types";

const normalizeCurrency = (currency: string): string => currency.trim().toLowerCase();

const isSafeCurrency = (currency: string): boolean => /^[a-z]{3}$/.test(currency);

const toStripeAmount = (amount: number): number => Math.round(amount);

const toOptionalNumber = (value: string | number | null): number | null => {
  if (value === null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export class PaymentService {
  private stripeClient: Stripe | null = null;

  private getStripeClient(): Stripe {
    if (this.stripeClient) return this.stripeClient;

    const secretKey = process.env.STRIPE_SECRET_KEY?.trim() ?? "";
    if (!secretKey) {
      throw new Error("Missing STRIPE_SECRET_KEY environment variable.");
    }

    this.stripeClient = new Stripe(secretKey);
    return this.stripeClient;
  }

  public async createPaymentIntent(
    input: CreatePaymentIntentInput
  ): Promise<Output<PaymentIntentOutput | null>> {
    try {
      if (!Number.isFinite(input.amount) || input.amount <= 0) {
        return failOutput("Invalid payment amount");
      }

      const currency = normalizeCurrency(input.currency);
      if (!isSafeCurrency(currency)) {
        return failOutput("Invalid currency");
      }

      const stripe = this.getStripeClient();
      const paymentIntent = await stripe.paymentIntents.create({
        amount: toStripeAmount(input.amount),
        currency,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      if (!paymentIntent.client_secret) {
        return failOutput("Error creating payment intent");
      }

      return okOutput(
        {
          clientSecret: paymentIntent.client_secret,
        },
        [`Payment intent created successfully: ${paymentIntent.id}`]
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected error";
      return failOutput(`PaymentUseCases::CreatePaymentIntent - Failed to create a payment intention: ${message}`);
    }
  }

  public async createProduct(
    input: CreateProductInput
  ): Promise<Output<PaymentProductOutput | null>> {
    try {
      if (!input.productName.trim()) {
        return failOutput("Invalid product name");
      }

      if (!Number.isFinite(input.price) || input.price <= 0) {
        return failOutput("Invalid product price");
      }

      const currency = normalizeCurrency(input.currency);
      if (!isSafeCurrency(currency)) {
        return failOutput("Invalid currency");
      }

      const stripe = this.getStripeClient();

      const product = await stripe.products.create({
        name: input.productName.trim(),
        description: input.productDescription.trim() || undefined,
      });

      const price = await stripe.prices.create({
        unit_amount_decimal: String(input.price),
        currency,
        product: product.id,
        recurring: {
          interval: "month",
          interval_count: 1,
        },
      });

      return okOutput(
        {
          productId: product.id,
          priceId: price.id,
          productName: product.name,
          productDescription: product.description ?? null,
          price: toOptionalNumber(price.unit_amount_decimal),
          currency: price.currency,
          interval: price.recurring?.interval ?? null,
          intervalCount: price.recurring?.interval_count ?? null,
          createdAt: new Date(product.created * 1000).toISOString(),
          updatedAt: new Date(product.updated * 1000).toISOString(),
          productUrl: product.url ?? null,
          productImage: product.images ?? [],
        },
        ["Product created successfully"]
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected error";
      return failOutput(`PaymentUseCases::CreateProduct - Failed to create product: ${message}`);
    }
  }
}
