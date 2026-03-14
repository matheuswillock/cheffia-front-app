import { OrderHubService } from "@/app/api/useCases/orderhub";
import { failOutput, type Output } from "@/lib/server/output";
import type {
  CreatePaymentIntentInput,
  CreateProductInput,
  PaymentIntentOutput,
  PaymentProductOutput,
} from "./types";

const PRODUCT_REMOVED_MESSAGE =
  "Payment/product/create was deprecated because the Stripe flow was removed. Use the Asaas PIX payment endpoints.";

export class PaymentService {
  constructor(private readonly orderHub: OrderHubService = new OrderHubService()) {}

  public async createPaymentIntent(
    tenantId: string,
    input: CreatePaymentIntentInput
  ): Promise<Output<PaymentIntentOutput | null>> {
    return this.orderHub.createPayment(tenantId, {
      customerOrderId: input.customerOrderId,
      payTip: input.payTip,
      payer: input.payer,
    });
  }

  public async createProduct(
    _input: CreateProductInput
  ): Promise<Output<PaymentProductOutput | null>> {
    return failOutput(PRODUCT_REMOVED_MESSAGE, {
      code: "stripe_removed",
      message: PRODUCT_REMOVED_MESSAGE,
    });
  }
}
