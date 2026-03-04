import { NextRequest, NextResponse } from "next/server";
import { AsaasWebhookService } from "@/server/application/webhooks";
import { failOutput, okOutput } from "@/server/shared/output";
import { requireTenantContext, TenantContextError } from "@/server/shared/tenant";

export const runtime = "nodejs";

const toHeadersObject = (request: NextRequest): Record<string, string> => {
  const headers: Record<string, string> = {};
  for (const [name, value] of request.headers.entries()) {
    headers[name.toLowerCase()] = value;
  }
  return headers;
};

const getRequesterIp = (request: NextRequest): string | null => {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp?.trim()) return realIp.trim();

  return null;
};

const validateWebhookSecurity = (request: NextRequest): { signatureValidated: boolean } => {
  const allowUnsigned = process.env.ASAAS_WEBHOOK_ALLOW_UNSIGNED === "true";
  const configuredToken = process.env.ASAAS_WEBHOOK_TOKEN?.trim() ?? "";
  const receivedToken = request.headers.get("asaas-access-token")?.trim() ?? "";

  if (!configuredToken && !allowUnsigned) {
    throw new Error(
      "ASAAS_WEBHOOK_TOKEN is required. For local-only unsigned mode set ASAAS_WEBHOOK_ALLOW_UNSIGNED=true."
    );
  }

  if (configuredToken && receivedToken !== configuredToken) {
    throw new Error("Invalid Asaas webhook token.");
  }

  const allowList = (process.env.ASAAS_WEBHOOK_ALLOWED_IPS ?? "")
    .split(",")
    .map((ip) => ip.trim())
    .filter(Boolean);

  if (allowList.length) {
    const requesterIp = getRequesterIp(request);
    if (!requesterIp || !allowList.includes(requesterIp)) {
      throw new Error("Webhook IP not allowed.");
    }
  }

  return { signatureValidated: Boolean(configuredToken) };
};

export async function POST(request: NextRequest) {
  try {
    const security = validateWebhookSecurity(request);
    const tenant = await requireTenantContext({ request });

    const rawBody = await request.text();
    let payload: Record<string, unknown>;

    try {
      payload = JSON.parse(rawBody) as Record<string, unknown>;
    } catch {
      return NextResponse.json(failOutput("Invalid JSON payload"), { status: 400 });
    }

    const service = new AsaasWebhookService();
    const result = await service.processIncoming({
      tenantId: tenant.tenantId,
      payload,
      rawHeaders: toHeadersObject(request),
      signatureValidated: security.signatureValidated,
    });

    return NextResponse.json(okOutput(result, ["Asaas webhook received"]), { status: 200 });
  } catch (error) {
    if (error instanceof TenantContextError) {
      return NextResponse.json(failOutput(error.message), { status: 400 });
    }

    const message = error instanceof Error ? error.message : "Unexpected webhook error";
    console.error("asaas.webhook.error", { message });
    return NextResponse.json(failOutput(message), { status: 500 });
  }
}
