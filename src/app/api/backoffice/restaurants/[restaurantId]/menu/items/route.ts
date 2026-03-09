import { NextRequest, NextResponse } from "next/server";
import {
  BackofficeRestaurantsService,
  requireBackofficeUser,
  type BackofficeMenuItemInput,
} from "@/server/application/backoffice";
import { backofficeErrorResponse } from "../../../../_utils";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ restaurantId: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    await requireBackofficeUser({ minimumRole: "operator" });
    const { restaurantId } = await params;
    const body = (await request.json()) as BackofficeMenuItemInput;
    const service = new BackofficeRestaurantsService();
    const output = await service.addMenuItem(restaurantId, body);
    return NextResponse.json(output, { status: output.isValid ? 200 : 400 });
  } catch (error) {
    return backofficeErrorResponse(error);
  }
}
