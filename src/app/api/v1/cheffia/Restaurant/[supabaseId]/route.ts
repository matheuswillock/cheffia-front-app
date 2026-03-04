import { NextRequest, NextResponse } from "next/server";
import { RestaurantService } from "@/server/application/restaurant";
import { TenantContextError, requireTenantContext } from "@/server/shared/tenant";
import { fromThrowable } from "@/server/shared/output";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ supabaseId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { supabaseId } = await params;
  const service = new RestaurantService();

  try {
    let tenantId: string;

    try {
      const tenant = await requireTenantContext({ request });
      tenantId = tenant.tenantId;
    } catch (error) {
      if (!(error instanceof TenantContextError)) throw error;

      const derivedTenant = await service.getTenantBySupabaseId(supabaseId);
      if (!derivedTenant) {
        return NextResponse.json(
          {
            isValid: false,
            successMessages: [],
            errorMessages: ["Restaurant not found"],
            result: null,
          },
          { status: 400 }
        );
      }
      tenantId = derivedTenant;
    }

    const output = await service.requestBySupabaseId(tenantId, supabaseId);
    return NextResponse.json(output, { status: output.isValid ? 200 : 400 });
  } catch (error) {
    return NextResponse.json(fromThrowable(error), { status: 500 });
  }
}
