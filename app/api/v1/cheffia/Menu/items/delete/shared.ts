import { NextRequest, NextResponse } from "next/server";
import { MenuService } from "@/app/api/useCases/menu";
import { SupabaseIdempotencyRepository } from "@/app/api/infra/persistence/idempotency/supabaseIdempotencyRepository";
import { executeWithIdempotency } from "@/lib/server/idempotency";
import { failOutput } from "@/lib/server/output";
import { resolveRequestIdFromRequest } from "@/lib/server/requestId";
import { TenantContextError, requireTenantContext } from "@/lib/server/tenant";

interface HandleDeleteMenuItemParams {
  request: NextRequest;
  itemId: string;
  endpoint: string;
}

const resolveTenantId = async (request: NextRequest, itemId: string): Promise<string | null> => {
  const service = new MenuService();

  try {
    const tenant = await requireTenantContext({ request });
    return tenant.tenantId;
  } catch (error) {
    if (!(error instanceof TenantContextError)) throw error;
    return service.getTenantByMenuItemId(itemId);
  }
};

export const handleDeleteMenuItem = async ({
  request,
  itemId,
  endpoint,
}: HandleDeleteMenuItemParams): Promise<NextResponse> => {
  const service = new MenuService();
  const requestId = resolveRequestIdFromRequest(request);
  const idempotencyKey = request.headers.get("idempotency-key")?.trim() ?? null;

  if (!itemId.trim()) {
    return NextResponse.json(failOutput("itemId is required"), { status: 400 });
  }

  const tenantId = await resolveTenantId(request, itemId);
  if (!tenantId) {
    return NextResponse.json(
      failOutput("Tenant context is required or menu item was not found."),
      { status: 400 }
    );
  }

  if (!idempotencyKey) {
    const output = await service.deleteItem(tenantId, itemId, { requestId });
    return NextResponse.json(output, { status: output.isValid ? 200 : 400 });
  }

  const repository = new SupabaseIdempotencyRepository();
  const executed = await executeWithIdempotency({
    tenantId,
    method: "DELETE",
    endpoint,
    idempotencyKey,
    payloadForHash: { itemId },
    repository,
    execute: async () => {
      const output = await service.deleteItem(tenantId, itemId, { requestId });
      return { output, statusCode: output.isValid ? 200 : 400 };
    },
  });

  return NextResponse.json(executed.output, { status: executed.statusCode });
};
