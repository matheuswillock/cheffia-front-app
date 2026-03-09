import { NextRequest, NextResponse } from "next/server";
import { RestaurantFinancialOnboardingDocumentService } from "@/server/application/financialAccounts";
import { RestaurantService } from "@/server/application/restaurant";
import { SupabaseIdempotencyRepository } from "@/server/infra/persistence/idempotency/supabaseIdempotencyRepository";
import { executeWithIdempotency } from "@/server/shared/idempotency";
import { failOutput, fromThrowable } from "@/server/shared/output";
import { requireTenantContext, TenantContextError } from "@/server/shared/tenant";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ supabaseId: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { supabaseId } = await params;
  const restaurantId = supabaseId;
  const documentsService = new RestaurantFinancialOnboardingDocumentService();
  const restaurantService = new RestaurantService();
  const idempotencyKey = request.headers.get("idempotency-key")?.trim() ?? null;

  try {
    const tenant = await requireTenantContext({
      request,
      routeParams: { restaurantId },
      resolveTenantIdFromRestaurantId: (id) => restaurantService.getTenantByRestaurantId(id),
    });

    if (!idempotencyKey) {
      const output = await documentsService.syncDocuments(tenant.tenantId, restaurantId);
      return NextResponse.json(output, { status: output.isValid ? 200 : 400 });
    }

    const repository = new SupabaseIdempotencyRepository();
    const executed = await executeWithIdempotency({
      tenantId: tenant.tenantId,
      method: "POST",
      endpoint: `/api/v1/cheffia/Restaurant/${restaurantId}/financial-account/documents/sync`,
      idempotencyKey,
      payloadForHash: { restaurantId, action: "sync-documents" },
      repository,
      execute: async () => {
        const output = await documentsService.syncDocuments(tenant.tenantId, restaurantId);
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
