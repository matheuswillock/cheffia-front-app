import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { OrderHubService, type InputPaymentOrder } from "@/app/api/useCases/orderhub";
import { SupabaseIdempotencyRepository } from "@/app/api/infra/persistence/idempotency/supabaseIdempotencyRepository";
import { executeWithIdempotency } from "@/lib/server/idempotency";
import { failOutput, fromThrowable } from "@/lib/server/output";
import { requireTenantContext, TenantContextError } from "@/lib/server/tenant";

export const runtime = "nodejs";

const requestSchema = z.object({
  customerOrderId: z.string().uuid(),
  payTip: z.boolean().default(false),
  payer: z.object({
    name: z.string().trim().min(3),
    phoneNumber: z.string().trim().min(10),
    email: z.string().trim().email().optional().nullable(),
    document: z.string().trim().min(11).max(18).optional().nullable(),
  }),
});

const read = (input: Record<string, unknown>, ...keys: string[]): unknown => {
  for (const key of keys) {
    if (key in input) return input[key];
  }
  return undefined;
};

const readRecord = (input: Record<string, unknown>, ...keys: string[]): Record<string, unknown> => {
  for (const key of keys) {
    const value = input[key];
    if (value && typeof value === "object") {
      return value as Record<string, unknown>;
    }
  }
  return {};
};

const toStringValue = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const toBooleanValue = (value: unknown): boolean => value === true;

const parseInput = async (
  request: NextRequest
): Promise<{ data: InputPaymentOrder | null; errorMessage: string | null }> => {
  const raw = (await request.json()) as Record<string, unknown>;
  const payerRaw = readRecord(raw, "payer", "Payer");
  const parsed = requestSchema.safeParse({
    customerOrderId: toStringValue(read(raw, "customerOrderId", "CustomerOrderId")),
    payTip: toBooleanValue(read(raw, "payTip", "PayTip")),
    payer: {
      name: toStringValue(read(payerRaw, "name", "Name")),
      phoneNumber: toStringValue(read(payerRaw, "phoneNumber", "PhoneNumber")),
      email: toStringValue(read(payerRaw, "email", "Email")),
      document: toStringValue(read(payerRaw, "document", "Document")),
    },
  });

  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => issue.message).join("; ");
    return {
      data: null,
      errorMessage: `Invalid payment order input: ${issues}`,
    };
  }

  return {
    data: parsed.data,
    errorMessage: null,
  };
};

export async function POST(request: NextRequest) {
  const service = new OrderHubService();
  const idempotencyKey = request.headers.get("idempotency-key")?.trim() ?? null;

  try {
    const parsed = await parseInput(request);
    if (!parsed.data) {
      return NextResponse.json(failOutput(parsed.errorMessage ?? "Invalid payment order input"), {
        status: 400,
      });
    }

    const input = parsed.data;
    const derivedTenant = await service.getTenantByCustomerOrderId(input.customerOrderId);

    const tenant = await requireTenantContext({
      request,
      routeParams: {
        tenantId: derivedTenant ?? undefined,
      },
    });

    if (!idempotencyKey) {
      const output = await service.createPayment(tenant.tenantId, input);
      return NextResponse.json(output, { status: output.isValid ? 200 : 400 });
    }

    const repository = new SupabaseIdempotencyRepository();
    const executed = await executeWithIdempotency({
      tenantId: tenant.tenantId,
      method: "POST",
      endpoint: "/api/v1/cheffia/OrderHub/payment",
      idempotencyKey,
      payloadForHash: input,
      repository,
      execute: async () => {
        const output = await service.createPayment(tenant.tenantId, input);
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
