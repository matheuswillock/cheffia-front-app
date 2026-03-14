import { NextRequest, NextResponse } from "next/server";
import { MenuService } from "@/app/api/useCases/menu";
import { failOutput, fromThrowable } from "@/lib/server/output";
import { requireTenantContext } from "@/lib/server/tenant";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const service = new MenuService();

  try {
    const restaurantId = request.nextUrl.searchParams.get("restaurantId")?.trim() ?? "";
    if (!restaurantId) {
      return NextResponse.json(failOutput("restaurantId is required"), { status: 400 });
    }

    // `table` is part of the legacy contract but is not used in the current use case.

    const tenant = await requireTenantContext({
      request,
      routeParams: { restaurantId },
      resolveTenantIdFromRestaurantId: (id) => service.getTenantByRestaurantId(id),
    });

    const output = await service.getMenuLiveByRestaurantId(tenant.tenantId, restaurantId);
    return NextResponse.json(output, { status: output.isValid ? 200 : 400 });
  } catch (error) {
    return NextResponse.json(fromThrowable(error), { status: 500 });
  }
}
