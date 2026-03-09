import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  RestaurantFinancialOnboardingDocumentService,
  type UploadFinancialOnboardingDocumentInput,
} from "@/server/application/financialAccounts";
import { RestaurantService } from "@/server/application/restaurant";
import { SupabaseIdempotencyRepository } from "@/server/infra/persistence/idempotency/supabaseIdempotencyRepository";
import { executeWithIdempotency } from "@/server/shared/idempotency";
import { failOutput, fromThrowable } from "@/server/shared/output";
import { requireTenantContext, TenantContextError } from "@/server/shared/tenant";

export const runtime = "nodejs";

const uploadInputSchema = z.object({
  fileName: z.string().trim().min(1),
  contentType: z.string().trim().min(1),
  data: z.instanceof(Uint8Array).refine((value) => value.byteLength > 0),
});

interface RouteParams {
  params: Promise<{ supabaseId: string; documentId: string }>;
}

const parseInput = async (
  request: NextRequest
): Promise<z.infer<typeof uploadInputSchema>> => {
  const formData = await request.formData();
  const documentFile = formData.get("documentFile");

  if (!(documentFile instanceof File) || documentFile.size <= 0) {
    throw new Error("documentFile is required");
  }

  const parsed = uploadInputSchema.safeParse({
    fileName: documentFile.name,
    contentType: documentFile.type || "application/octet-stream",
    data: new Uint8Array(await documentFile.arrayBuffer()),
  });

  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => issue.message).join("; ");
    throw new Error(`Invalid onboarding document upload: ${issues}`);
  }

  return parsed.data;
};

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { supabaseId, documentId } = await params;
  const restaurantId = supabaseId;
  const documentsService = new RestaurantFinancialOnboardingDocumentService();
  const restaurantService = new RestaurantService();
  const idempotencyKey = request.headers.get("idempotency-key")?.trim() ?? null;

  try {
    const tenant = await requireTenantContext({
      request,
      routeParams: { restaurantId },
      resolveTenantIdFromRestaurantId: (id) => restaurantService.getTenantByRestaurantId(id),
    });

    const parsedInput = await parseInput(request);
    const input: UploadFinancialOnboardingDocumentInput = parsedInput;

    if (!idempotencyKey) {
      const output = await documentsService.uploadDocument(
        tenant.tenantId,
        restaurantId,
        documentId,
        input
      );
      return NextResponse.json(output, { status: output.isValid ? 200 : 400 });
    }

    const sha256 = createHash("sha256").update(parsedInput.data).digest("hex");
    const repository = new SupabaseIdempotencyRepository();
    const executed = await executeWithIdempotency({
      tenantId: tenant.tenantId,
      method: "POST",
      endpoint: `/api/v1/cheffia/Restaurant/${restaurantId}/financial-account/documents/${documentId}/upload`,
      idempotencyKey,
      payloadForHash: {
        restaurantId,
        documentId,
        fileName: parsedInput.fileName,
        contentType: parsedInput.contentType,
        fileSizeBytes: parsedInput.data.byteLength,
        sha256,
      },
      repository,
      execute: async () => {
        const output = await documentsService.uploadDocument(
          tenant.tenantId,
          restaurantId,
          documentId,
          input
        );
        return { output, statusCode: output.isValid ? 200 : 400 };
      },
    });

    return NextResponse.json(executed.output, { status: executed.statusCode });
  } catch (error) {
    if (error instanceof TenantContextError) {
      return NextResponse.json(failOutput(error.message), { status: 400 });
    }

    return NextResponse.json(fromThrowable(error), { status: 500 });
  }
}
