import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { OrderHubService, type InputRequestOrder } from "@/app/api/useCases/orderhub";
import { SupabaseIdempotencyRepository } from "@/app/api/infra/persistence/idempotency/supabaseIdempotencyRepository";
import { executeWithIdempotency } from "@/lib/server/idempotency";
import { failOutput, fromThrowable } from "@/lib/server/output";
import { requireTenantContext, TenantContextError } from "@/lib/server/tenant";

export const runtime = "nodejs";

const requestOrderItemSchema = z.object({
  menuItemId: z.string().uuid(),
  quantity: z.number().int().positive(),
  comments: z.string().default(""),
  tableNumber: z.string().trim().min(1),
  orderStatus: z.string().trim().optional().nullable(),
});

const requestOrderSchema = z.object({
  customerOrderId: z.string().uuid().optional().nullable(),
  restaurantId: z.string().uuid(),
  tableNumber: z.string().trim().min(1),
  orderItems: z.array(requestOrderItemSchema).min(1),
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

const parseInput = async (request: NextRequest): Promise<InputRequestOrder> => {
  const raw = (await request.json()) as Record<string, unknown>;
  const rawItems = read(raw, "orderItems", "OrderItems");
  const orderItems = Array.isArray(rawItems) ? rawItems : [];

  const parsed = requestOrderSchema.safeParse({
    customerOrderId: toStringValue(read(raw, "customerOrderId", "CustomerOrderId")),
    restaurantId: toStringValue(read(raw, "restaurantId", "RestaurantId")),
    tableNumber: toStringValue(read(raw, "tableNumber", "TableNumber")),
    orderItems: orderItems.map((item) => {
      const source = (item ?? {}) as Record<string, unknown>;
      return {
        menuItemId: toStringValue(read(source, "menuItemId", "MenuItemId")),
        quantity: toNumberValue(read(source, "quantity", "Quantity")),
        comments: toStringValue(read(source, "comments", "Comments")) ?? "",
        tableNumber:
          toStringValue(read(source, "tableNumber", "TableNumber")) ??
          toStringValue(read(raw, "tableNumber", "TableNumber")) ??
          "",
        orderStatus: toStringValue(read(source, "orderStatus", "OrderStatus")),
      };
    }),
  });

  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => issue.message).join("; ");
    throw new Error(`Invalid order input: ${issues}`);
  }

  return parsed.data;
};

export async function POST(request: NextRequest) {
  const service = new OrderHubService();
  const idempotencyKey = request.headers.get("idempotency-key")?.trim() ?? null;

  try {
    const input = await parseInput(request);

    const tenant = await requireTenantContext({
      request,
      routeParams: { restaurantId: input.restaurantId },
      resolveTenantIdFromRestaurantId: (restaurantId) => service.getTenantByRestaurantId(restaurantId),
    });

    if (!idempotencyKey) {
      const output = await service.sendOrder(tenant.tenantId, input);
      return NextResponse.json(output, { status: output.isValid ? 200 : 400 });
    }

    const repository = new SupabaseIdempotencyRepository();
    const executed = await executeWithIdempotency({
      tenantId: tenant.tenantId,
      method: "POST",
      endpoint: "/api/v1/cheffia/OrderHub/send",
      idempotencyKey,
      payloadForHash: input,
      repository,
      execute: async () => {
        const output = await service.sendOrder(tenant.tenantId, input);
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
