import { NextRequest, NextResponse } from "next/server";
import {
  BackofficeRestaurantsService,
  requireBackofficeUser,
} from "@/app/api/useCases/backoffice";
import { backofficeErrorResponse } from "../../../../../_utils";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ restaurantId: string; itemId: string }>;
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    await requireBackofficeUser({ minimumRole: "operator" });
    const { restaurantId, itemId } = await params;
    const service = new BackofficeRestaurantsService();
    const output = await service.deleteMenuItem(restaurantId, itemId);
    return NextResponse.json(output, { status: output.isValid ? 200 : 400 });
  } catch (error) {
    return backofficeErrorResponse(error);
  }
}
