import { NextRequest, NextResponse } from "next/server";
import { RestaurantFinancialAccountService } from "@/app/api/useCases/financialAccounts";
import { RestaurantService } from "@/app/api/useCases/restaurant";
import { SupabaseIdempotencyRepository } from "@/app/api/infra/persistence/idempotency/supabaseIdempotencyRepository";
import { executeWithIdempotency } from "@/lib/server/idempotency";
import { failOutput, fromThrowable } from "@/lib/server/output";
import { requireTenantContext, TenantContextError } from "@/lib/server/tenant";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ supabaseId: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { supabaseId } = await params;
  const restaurantId = supabaseId;
  const financialAccountService = new RestaurantFinancialAccountService();
  const restaurantService = new RestaurantService();
  const idempotencyKey = request.headers.get("idempotency-key")?.trim() ?? null;

  try {
    const tenant = await requireTenantContext({
      request,
      routeParams: { restaurantId },
      resolveTenantIdFromRestaurantId: (id) => restaurantService.getTenantByRestaurantId(id),
    });

    if (!idempotencyKey) {
      const output = await financialAccountService.provisionSubaccount(tenant.tenantId, restaurantId);
      return NextResponse.json(output, { status: output.isValid ? 200 : 400 });
    }

    const repository = new SupabaseIdempotencyRepository();
    const executed = await executeWithIdempotency({
      tenantId: tenant.tenantId,
      method: "POST",
      endpoint: `/api/v1/cheffia/Restaurant/${restaurantId}/financial-account/provision`,
      idempotencyKey,
      payloadForHash: { restaurantId },
      repository,
      execute: async () => {
        const output = await financialAccountService.provisionSubaccount(tenant.tenantId, restaurantId);
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
