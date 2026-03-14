import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { OrderHubService } from "@/app/api/useCases/orderhub";
import { OrderPrintJobsUseCase } from "@/app/api/useCases/orderPrint";
import type { ClaimOrderPrintJobInput } from "@/lib/printing/jobContracts";
import { failOutput, fromThrowable } from "@/lib/server/output";
import { requireTenantContext, TenantContextError } from "@/lib/server/tenant";

export const runtime = "nodejs";

const claimSchema = z.object({
  restaurantId: z.string().uuid(),
  eventId: z.string().uuid(),
  printerId: z.string().trim().optional().nullable(),
});

export async function POST(request: NextRequest) {
  const orderHubService = new OrderHubService();
  const printUseCase = new OrderPrintJobsUseCase();

  try {
    const raw = (await request.json()) as unknown;
    const parsed = claimSchema.safeParse(raw);

    if (!parsed.success) {
      return NextResponse.json(
        failOutput(parsed.error.issues.map((issue) => issue.message).join("; ")),
        { status: 400 }
      );
    }

    const input: ClaimOrderPrintJobInput = parsed.data;

    const tenant = await requireTenantContext({
      request,
      routeParams: { restaurantId: input.restaurantId },
      resolveTenantIdFromRestaurantId: (restaurantId) =>
        orderHubService.getTenantByRestaurantId(restaurantId),
    });

    const output = await printUseCase.claim(tenant.tenantId, input);
    return NextResponse.json(output, { status: output.isValid ? 200 : 400 });
  } catch (error) {
    if (error instanceof TenantContextError) {
      return NextResponse.json(failOutput(error.message), { status: 400 });
    }

    return NextResponse.json(fromThrowable(error), { status: 500 });
  }
}
