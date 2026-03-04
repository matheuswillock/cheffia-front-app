import { NextRequest, NextResponse } from "next/server";
import { RestaurantService } from "@/server/application/restaurant";
import { TenantContextError, requireTenantContext } from "@/server/shared/tenant";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token")?.trim();

  if (!token) {
    return new NextResponse("Missing token", { status: 400 });
  }

  const service = new RestaurantService();

  try {
    let tenantId: string;

    try {
      const tenant = await requireTenantContext({ request });
      tenantId = tenant.tenantId;
    } catch (error) {
      if (!(error instanceof TenantContextError)) throw error;

      const derivedTenant = await service.getTenantByVerificationCode(token);
      if (!derivedTenant) {
        return new NextResponse(null, { status: 400 });
      }
      tenantId = derivedTenant;
    }

    const confirmed = await service.confirmEmail(tenantId, token);

    if (!confirmed) {
      return new NextResponse(null, { status: 400 });
    }

    return new NextResponse("Email confirmed successfully", { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error confirming email";
    return new NextResponse(message, { status: 500 });
  }
}
