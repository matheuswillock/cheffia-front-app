#!/usr/bin/env node

import {
  DEFAULT_PATH,
  getArgValue,
  normalizePath,
  resolveNgrokWebhookUrl,
} from "./print-ngrok-webhook-url.mjs";

const DEFAULT_EVENT_TYPE = "TEST_PING";
const DEFAULT_TIMEOUT_MS = 10000;

function parseTimeout(rawValue) {
  if (!rawValue) return DEFAULT_TIMEOUT_MS;
  const value = Number.parseInt(rawValue, 10);
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_TIMEOUT_MS;
}

function createPayload(eventType) {
  const id = `ngrok-smoke-${Date.now()}`;

  return {
    id,
    event: eventType,
    eventId: id,
    dateCreated: new Date().toISOString(),
    source: "codex-ngrok-smoke",
  };
}

async function main() {
  const webhookPath = normalizePath(
    getArgValue("--path") || process.env.WEBHOOK_PATH || DEFAULT_PATH
  );
  const baseUrlOverride =
    getArgValue("--base-url") || process.env.NGROK_PUBLIC_BASE_URL || null;
  const tenantId =
    getArgValue("--tenant-id") ||
    process.env.NGROK_WEBHOOK_TENANT_ID ||
    process.env.MIGRATION_E2E_TENANT_ID;
  const eventType =
    getArgValue("--event-type") || process.env.NGROK_WEBHOOK_EVENT_TYPE || DEFAULT_EVENT_TYPE;
  const token = getArgValue("--token") || process.env.ASAAS_WEBHOOK_TOKEN || "";
  const timeoutMs = parseTimeout(
    getArgValue("--timeout-ms") || process.env.NGROK_WEBHOOK_TIMEOUT_MS
  );

  if (!tenantId) {
    console.error(
      "[ngrok:webhook:check] Informe o tenant com --tenant-id ou NGROK_WEBHOOK_TENANT_ID."
    );
    process.exit(1);
  }

  let webhookUrl;
  try {
    webhookUrl = baseUrlOverride
      ? `${baseUrlOverride.replace(/\/$/, "")}${webhookPath}`
      : await resolveNgrokWebhookUrl({ webhookPath });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    console.error("[ngrok:webhook:check] Inicie o tunel antes: bun run ngrok:webhook");
    process.exit(1);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  const payload = createPayload(eventType);
  const headers = {
    "content-type": "application/json",
    "x-tenant-id": tenantId,
    "x-request-id": payload.id,
    "ngrok-skip-browser-warning": "true",
  };

  if (token) {
    headers["asaas-access-token"] = token;
  }

  let response;
  try {
    response = await fetch(webhookUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch (error) {
    clearTimeout(timeoutId);
    const message =
      error instanceof Error && error.name === "AbortError"
        ? `[ngrok:webhook:check] Timeout apos ${timeoutMs}ms ao chamar ${webhookUrl}.`
        : `[ngrok:webhook:check] Falha na chamada ao webhook: ${
            error instanceof Error ? error.message : String(error)
          }`;
    console.error(message);
    process.exit(1);
  }

  clearTimeout(timeoutId);

  const rawText = await response.text();
  let parsedBody = rawText;

  try {
    parsedBody = JSON.stringify(JSON.parse(rawText), null, 2);
  } catch {
    parsedBody = rawText;
  }

  if (!response.ok) {
    console.error(`[ngrok:webhook:check] Webhook respondeu ${response.status}.`);
    console.error(parsedBody);
    process.exit(1);
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        webhookUrl,
        tenantId,
        eventType,
        providerEventId: payload.id,
        status: response.status,
        tokenMode: token ? "signed" : "unsigned-or-env-not-required",
        response: parsedBody,
      },
      null,
      2
    )
  );
}

main();
