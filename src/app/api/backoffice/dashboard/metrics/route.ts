import { NextRequest, NextResponse } from "next/server";
import {
  BackofficeDashboardService,
  requireBackofficeUser,
  type BackofficeMetricsPeriod,
} from "@/server/application/backoffice";
import { backofficeErrorResponse } from "../../_utils";

export const runtime = "nodejs";

const resolvePeriod = (value: string | null): BackofficeMetricsPeriod => {
  if (value === "30d" || value === "6m") return value;
  return "7d";
};

export async function GET(request: NextRequest) {
  try {
    await requireBackofficeUser({ minimumRole: "operator" });
    const period = resolvePeriod(request.nextUrl.searchParams.get("period"));
    const service = new BackofficeDashboardService();
    const output = await service.getMetrics(period);
    return NextResponse.json(output, { status: 200 });
  } catch (error) {
    return backofficeErrorResponse(error);
  }
}
