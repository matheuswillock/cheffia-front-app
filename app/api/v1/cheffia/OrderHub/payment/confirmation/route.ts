import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { OrderHubService, type InputConfirmPayment } from "@/app/api/useCases/orderhub";
import { SupabaseIdempotencyRepository } from "@/app/api/infra/persistence/idempotency/supabaseIdempotencyRepository";
import { executeWithIdempotency } from "@/lib/server/idempotency";
import { failOutput, fromThrowable } from "@/lib/server/output";
import { requireTenantContext, TenantContextError } from "@/lib/server/tenant";

export const runtime = "nodejs";

const requestSchema = z.object({
  paymentPixId: z.string().trim().min(1),
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

const parseInput = async (request: NextRequest): Promise<InputConfirmPayment> => {
  const raw = (await request.json()) as Record<string, unknown>;
  const parsed = requestSchema.safeParse({
    paymentPixId: toStringValue(read(raw, "paymentPixId", "PaymentPixId")),
  });

  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => issue.message).join("; ");
    throw new Error(`Invalid payment confirmation input: ${issues}`);
  }

  return parsed.data;
};

export async function POST(request: NextRequest) {
  const service = new OrderHubService();
  const idempotencyKey = request.headers.get("idempotency-key")?.trim() ?? null;

  try {
    const input = await parseInput(request);
    const derivedTenant = await service.getTenantByTransactionId(input.paymentPixId);

    const tenant = await requireTenantContext({
      request,
      routeParams: {
        tenantId: derivedTenant ?? undefined,
      },
    });

    if (!idempotencyKey) {
      const output = await service.confirmPayment(tenant.tenantId, input);
      return NextResponse.json(output, { status: output.isValid ? 200 : 400 });
    }

    const repository = new SupabaseIdempotencyRepository();
    const executed = await executeWithIdempotency({
      tenantId: tenant.tenantId,
      method: "POST",
      endpoint: "/api/v1/cheffia/OrderHub/payment/confirmation",
      idempotencyKey,
      payloadForHash: input,
      repository,
      execute: async () => {
        const output = await service.confirmPayment(tenant.tenantId, input);
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
