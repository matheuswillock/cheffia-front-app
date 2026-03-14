import { NextRequest, NextResponse } from "next/server";
import { RestaurantService } from "@/app/api/useCases/restaurant";
import { executeWithIdempotency } from "@/lib/server/idempotency";
import { fromThrowable } from "@/lib/server/output";
import { requireTenantContext } from "@/lib/server/tenant";
import { SupabaseIdempotencyRepository } from "@/app/api/infra/persistence/idempotency/supabaseIdempotencyRepository";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ supabaseId: string }>;
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { supabaseId: restaurantId } = await params;
  const idempotencyKey = request.headers.get("idempotency-key")?.trim() ?? null;
  const service = new RestaurantService();

  try {
    const tenant = await requireTenantContext({
      request,
      routeParams: { restaurantId },
      resolveTenantIdFromRestaurantId: (id) => service.getTenantByRestaurantId(id),
    });

    if (!idempotencyKey) {
      const output = await service.deleteRestaurant(tenant.tenantId, restaurantId);
      return NextResponse.json(output, { status: output.isValid ? 200 : 400 });
    }

    const repository = new SupabaseIdempotencyRepository();
    const executed = await executeWithIdempotency({
      tenantId: tenant.tenantId,
      method: "DELETE",
      endpoint: `/api/v1/cheffia/Restaurant/${restaurantId}/delete`,
      idempotencyKey,
      payloadForHash: { restaurantId },
      repository,
      execute: async () => {
        const output = await service.deleteRestaurant(tenant.tenantId, restaurantId);
        return { output, statusCode: output.isValid ? 200 : 400 };
      },
    });

    return NextResponse.json(executed.output, { status: executed.statusCode });
  } catch (error) {
    return NextResponse.json(fromThrowable(error), { status: 500 });
  }
}
