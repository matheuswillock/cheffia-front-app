import { NextRequest, NextResponse } from "next/server";
import { RestaurantFinancialOnboardingDocumentService } from "@/server/application/financialAccounts";
import { RestaurantService } from "@/server/application/restaurant";
import { failOutput, fromThrowable } from "@/server/shared/output";
import { requireTenantContext, TenantContextError } from "@/server/shared/tenant";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ supabaseId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { supabaseId } = await params;
  const restaurantId = supabaseId;
  const documentsService = new RestaurantFinancialOnboardingDocumentService();
  const restaurantService = new RestaurantService();

  try {
    const tenant = await requireTenantContext({
      request,
      routeParams: { restaurantId },
      resolveTenantIdFromRestaurantId: (id) => restaurantService.getTenantByRestaurantId(id),
    });

    const output = await documentsService.listDocuments(tenant.tenantId, restaurantId);
    return NextResponse.json(output, { status: output.isValid ? 200 : 400 });
  } catch (error) {
    if (error instanceof TenantContextError) {
      return NextResponse.json(failOutput(error.message), { status: 400 });
    }

    return NextResponse.json(fromThrowable(error), { status: 500 });
  }
}
