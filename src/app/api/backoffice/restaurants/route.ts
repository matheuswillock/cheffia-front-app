import { NextRequest, NextResponse } from "next/server";
import {
  BackofficeRestaurantsService,
  requireBackofficeUser,
} from "@/server/application/backoffice";
import { backofficeErrorResponse } from "../_utils";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    await requireBackofficeUser({ minimumRole: "operator" });
    const search = request.nextUrl.searchParams.get("q")?.trim() ?? "";
    const status = request.nextUrl.searchParams.get("status")?.trim() ?? "all";
    const service = new BackofficeRestaurantsService();
    const output = await service.list(search, status);
    return NextResponse.json(output, { status: output.isValid ? 200 : 400 });
  } catch (error) {
    return backofficeErrorResponse(error);
  }
}
