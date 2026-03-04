import { NextRequest, NextResponse } from "next/server";
import { MenuService } from "@/server/application/menu";
import { SupabaseIdempotencyRepository } from "@/server/infra/persistence/idempotency/supabaseIdempotencyRepository";
import { executeWithIdempotency } from "@/server/shared/idempotency";
import { failOutput } from "@/server/shared/output";
import { TenantContextError, requireTenantContext } from "@/server/shared/tenant";

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
    const output = await service.deleteItem(tenantId, itemId);
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
      const output = await service.deleteItem(tenantId, itemId);
      return { output, statusCode: output.isValid ? 200 : 400 };
    },
  });

  return NextResponse.json(executed.output, { status: executed.statusCode });
};
