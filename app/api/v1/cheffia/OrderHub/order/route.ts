import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { OrderHubService } from "@/app/api/useCases/orderhub";
import { failOutput, fromThrowable } from "@/lib/server/output";
import { requireTenantContext, TenantContextError } from "@/lib/server/tenant";

export const runtime = "nodejs";

const requestSchema = z.object({
  restaurantId: z.string().uuid(),
  customerOrderId: z.string().uuid(),
});

export async function GET(request: NextRequest) {
  const service = new OrderHubService();

  try {
    const url = new URL(request.url);
    const parsed = requestSchema.safeParse({
      restaurantId: url.searchParams.get("restaurantId"),
      customerOrderId: url.searchParams.get("customerOrderId"),
    });

    if (!parsed.success) {
      const issues = parsed.error.issues.map((issue) => issue.message).join("; ");
      return NextResponse.json(failOutput(`Invalid query params: ${issues}`), { status: 400 });
    }

    const tenant = await requireTenantContext({
      request,
      routeParams: { restaurantId: parsed.data.restaurantId },
      resolveTenantIdFromRestaurantId: (restaurantId) => service.getTenantByRestaurantId(restaurantId),
    });

    const output = await service.getOrder(
      tenant.tenantId,
      parsed.data.restaurantId,
      parsed.data.customerOrderId
    );

    return NextResponse.json(output, { status: output.isValid ? 200 : 400 });
  } catch (error) {
    if (error instanceof TenantContextError) {
      return NextResponse.json(failOutput(error.message), { status: 400 });
    }

    return NextResponse.json(fromThrowable(error), { status: 500 });
  }
}
