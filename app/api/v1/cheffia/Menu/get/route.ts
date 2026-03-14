import { NextRequest, NextResponse } from "next/server";
import { MenuService } from "@/app/api/useCases/menu";
import { failOutput, fromThrowable } from "@/lib/server/output";
import { requireTenantContext } from "@/lib/server/tenant";

export const runtime = "nodejs";

const parseRestaurantIdFromBody = (body: unknown): string | null => {
  if (!body || typeof body !== "object") return null;
  const data = body as {
    restaurantId?: unknown;
    params?: { restaurantId?: unknown };
  };

  const direct = typeof data.restaurantId === "string" ? data.restaurantId.trim() : "";
  if (direct) return direct;

  const nested =
    data.params && typeof data.params.restaurantId === "string"
      ? data.params.restaurantId.trim()
      : "";
  return nested || null;
};

const handleGetMenu = async (
  request: NextRequest,
  restaurantId: string | null
): Promise<NextResponse> => {
  if (!restaurantId) {
    return NextResponse.json(failOutput("restaurantId is required"), { status: 400 });
  }

  const service = new MenuService();
  const tenant = await requireTenantContext({
    request,
    routeParams: { restaurantId },
    resolveTenantIdFromRestaurantId: (id) => service.getTenantByRestaurantId(id),
  });

  const output = await service.getMenuByRestaurantId(tenant.tenantId, restaurantId);
  return NextResponse.json(output, { status: output.isValid ? 200 : 400 });
};

export async function GET(request: NextRequest) {
  try {
    const restaurantId = request.nextUrl.searchParams.get("restaurantId")?.trim() ?? null;
    return await handleGetMenu(request, restaurantId);
  } catch (error) {
    return NextResponse.json(fromThrowable(error), { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as unknown;
    const restaurantId = parseRestaurantIdFromBody(body);
    return await handleGetMenu(request, restaurantId);
  } catch (error) {
    return NextResponse.json(fromThrowable(error), { status: 500 });
  }
}
