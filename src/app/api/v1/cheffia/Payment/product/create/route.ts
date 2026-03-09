import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { OrderHubService } from "@/server/application/orderhub";
import { PaymentService, type CreateProductInput } from "@/server/application/payments";
import { SupabaseIdempotencyRepository } from "@/server/infra/persistence/idempotency/supabaseIdempotencyRepository";
import { executeWithIdempotency } from "@/server/shared/idempotency";
import { failOutput, fromThrowable } from "@/server/shared/output";
import { requireTenantContext, TenantContextError } from "@/server/shared/tenant";

export const runtime = "nodejs";

const requestSchema = z.object({
  productName: z.string().trim().min(1),
  productDescription: z.string().trim().default(""),
  price: z.number().positive(),
  currency: z.string().trim().min(3).max(3).default("brl"),
  tenantId: z.string().trim().min(1).optional(),
  restaurantId: z.string().uuid().optional(),
});

const read = (input: Record<string, unknown>, ...keys: string[]): unknown => {
  for (const key of keys) {
    if (key in input) return input[key];
  }
  return undefined;
};

const toStringValue = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const toNumberValue = (value: unknown): number => {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return Number.NaN;
};

const parseInput = async (
  request: NextRequest
): Promise<CreateProductInput & { tenantId?: string; restaurantId?: string }> => {
  const raw = (await request.json()) as Record<string, unknown>;
  const parsed = requestSchema.safeParse({
    productName: toStringValue(read(raw, "productName", "ProductName")),
    productDescription:
      toStringValue(read(raw, "productDescription", "ProductDescription")) ?? "",
    price: toNumberValue(read(raw, "price", "Price")),
    currency: toStringValue(read(raw, "currency", "Currency")) ?? "brl",
    tenantId: toStringValue(read(raw, "tenantId", "TenantId")) ?? undefined,
    restaurantId: toStringValue(read(raw, "restaurantId", "RestaurantId")) ?? undefined,
  });

  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => issue.message).join("; ");
    throw new Error(`Invalid product create input: ${issues}`);
  }

  return parsed.data;
};

export async function POST(request: NextRequest) {
  const service = new PaymentService();
  const orderHubService = new OrderHubService();
  const idempotencyKey = request.headers.get("idempotency-key")?.trim() ?? null;

  try {
    const input = await parseInput(request);
    const tenant = await requireTenantContext({
      request,
      routeParams: {
        tenantId: input.tenantId,
        restaurantId: input.restaurantId,
      },
      resolveTenantIdFromRestaurantId: (restaurantId) =>
        orderHubService.getTenantByRestaurantId(restaurantId),
    });

    const payload: CreateProductInput = {
      productName: input.productName,
      productDescription: input.productDescription,
      price: input.price,
      currency: input.currency,
    };

    if (!idempotencyKey) {
      const output = await service.createProduct(payload);
      return NextResponse.json(output, { status: output.isValid ? 200 : 400 });
    }

    const repository = new SupabaseIdempotencyRepository();
    const executed = await executeWithIdempotency({
      tenantId: tenant.tenantId,
      method: "POST",
      endpoint: "/api/v1/cheffia/Payment/product/create",
      idempotencyKey,
      payloadForHash: payload,
      repository,
      execute: async () => {
        const output = await service.createProduct(payload);
        return { output, statusCode: output.isValid ? 200 : 400 };
      },
    });

    return NextResponse.json(executed.output, { status: executed.statusCode });
  } catch (error) {
    if (error instanceof TenantContextError) {
      return NextResponse.json(failOutput(error.message), { status: 400 });
    }

    return NextResponse.json(fromThrowable(error), { status: 500 });
  }
}
