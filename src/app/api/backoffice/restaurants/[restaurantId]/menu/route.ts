import { NextRequest, NextResponse } from "next/server";
import {
  BackofficeRestaurantsService,
  requireBackofficeUser,
} from "@/server/application/backoffice";
import { backofficeErrorResponse } from "../../../_utils";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ restaurantId: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    await requireBackofficeUser({ minimumRole: "operator" });
    const { restaurantId } = await params;
    const service = new BackofficeRestaurantsService();
    const output = await service.getMenu(restaurantId);
    return NextResponse.json(output, { status: output.isValid ? 200 : 400 });
  } catch (error) {
    return backofficeErrorResponse(error);
  }
}
