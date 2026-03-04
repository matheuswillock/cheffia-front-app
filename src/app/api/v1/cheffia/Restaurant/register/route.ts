import { NextRequest, NextResponse } from "next/server";
import { RestaurantService } from "@/server/application/restaurant";
import { executeWithIdempotency } from "@/server/shared/idempotency";
import { requireTenantContext, TenantContextError } from "@/server/shared/tenant";
import { fromThrowable } from "@/server/shared/output";
import { SupabaseIdempotencyRepository } from "@/server/infra/persistence/idempotency/supabaseIdempotencyRepository";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const service = new RestaurantService();
  const idempotencyKey = request.headers.get("idempotency-key")?.trim() ?? null;

  try {
    const body = (await request.json()) as unknown;

    let tenantId: string | null = null;
    try {
      const tenant = await requireTenantContext({ request });
      tenantId = tenant.tenantId;
    } catch (error) {
      if (!(error instanceof TenantContextError)) throw error;
      // Register can bootstrap tenant from supabaseId when no tenant context exists yet.
      tenantId = null;
    }

    if (!idempotencyKey || !tenantId) {
      const output = await service.register(body, tenantId);
      return NextResponse.json(output, { status: output.isValid ? 200 : 400 });
    }

    const idempotencyRepository = new SupabaseIdempotencyRepository();
    const executed = await executeWithIdempotency({
      tenantId,
      method: "POST",
      endpoint: "/api/v1/cheffia/Restaurant/register",
      idempotencyKey,
      payloadForHash: body,
      repository: idempotencyRepository,
      execute: async () => {
        const output = await service.register(body, tenantId);
        return { output, statusCode: output.isValid ? 200 : 400 };
      },
    });

    return NextResponse.json(executed.output, { status: executed.statusCode });
  } catch (error) {
    return NextResponse.json(fromThrowable(error), { status: 500 });
  }
}
