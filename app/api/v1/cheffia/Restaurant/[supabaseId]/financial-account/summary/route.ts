import { NextRequest, NextResponse } from "next/server";
import { RestaurantFinancialSummaryService } from "@/app/api/useCases/financialAccounts";
import { RestaurantService } from "@/app/api/useCases/restaurant";
import { failOutput, fromThrowable } from "@/lib/server/output";
import { requireTenantContext, TenantContextError } from "@/lib/server/tenant";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ supabaseId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { supabaseId } = await params;
  const restaurantId = supabaseId;
  const financialSummaryService = new RestaurantFinancialSummaryService();
  const restaurantService = new RestaurantService();

  try {
    const tenant = await requireTenantContext({
      request,
      routeParams: { restaurantId },
      resolveTenantIdFromRestaurantId: (id) => restaurantService.getTenantByRestaurantId(id),
    });

    const output = await financialSummaryService.getSummary(tenant.tenantId, restaurantId);
    return NextResponse.json(output, { status: output.isValid ? 200 : 400 });
  } catch (error) {
    if (error instanceof TenantContextError) {
      return NextResponse.json(failOutput(error.message), { status: 400 });
    }

    return NextResponse.json(fromThrowable(error), { status: 500 });
  }
}
