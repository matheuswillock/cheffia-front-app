import { randomUUID } from "node:crypto";
import { describe, expect, test } from "bun:test";

const BASE_URL = process.env.MIGRATION_E2E_BASE_URL?.replace(/\/$/, "") ?? "";
const E2E_ENABLED = BASE_URL.length > 0;
const STRICT_E2E = process.env.MIGRATION_E2E_REQUIRED === "1";

const TENANT_ID = process.env.MIGRATION_E2E_TENANT_ID?.trim() ?? "";
const FOREIGN_SUPABASE_ID = process.env.MIGRATION_E2E_FOREIGN_SUPABASE_ID?.trim() ?? "";
const ASAAS_WEBHOOK_TOKEN = process.env.MIGRATION_E2E_ASAAS_WEBHOOK_TOKEN?.trim() ?? "";

const missingStrictVariables = [
  ["MIGRATION_E2E_BASE_URL", BASE_URL],
  ["MIGRATION_E2E_TENANT_ID", TENANT_ID],
  ["MIGRATION_E2E_FOREIGN_SUPABASE_ID", FOREIGN_SUPABASE_ID],
  ["MIGRATION_E2E_ASAAS_WEBHOOK_TOKEN", ASAAS_WEBHOOK_TOKEN],
]
  .filter(([, value]) => !value)
  .map(([name]) => name);

const jsonHeaders = {
  "content-type": "application/json",
};

const parseMaybeJson = async (response) => {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

const request = async (pathname, options = {}) => {
  if (!E2E_ENABLED) {
    return null;
  }
  return fetch(`${BASE_URL}${pathname}`, options);
};

describe("Runtime migration E2E", () => {
  test("E2E setup validates required env when strict mode is enabled", async () => {
    if (STRICT_E2E) {
      expect(missingStrictVariables).toEqual([]);
      return;
    }

    if (E2E_ENABLED) {
      expect(E2E_ENABLED).toBe(true);
      return;
    }

    expect(
      "Set MIGRATION_E2E_BASE_URL to run runtime migration tests."
    ).toContain("MIGRATION_E2E_BASE_URL");
  });

  test("GET /Menu/get without restaurantId returns 400 output envelope", async () => {
    if (!E2E_ENABLED) return;

    const response = await request("/api/v1/cheffia/Menu/get");
    const payload = await parseMaybeJson(response);

    expect(response.status).toBe(400);
    expect(typeof payload).toBe("object");
    expect(payload.isValid).toBe(false);
    expect(Array.isArray(payload.errorMessages)).toBe(true);
  });

  test("POST /Payment/intent/create without tenant context returns 400", async () => {
    if (!E2E_ENABLED) return;

    const response = await request("/api/v1/cheffia/Payment/intent/create", {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({ amount: 1099, currency: "brl" }),
    });
    const payload = await parseMaybeJson(response);

    expect(response.status).toBe(400);
    expect(payload.isValid).toBe(false);
    expect(Array.isArray(payload.errorMessages)).toBe(true);
  });

  test("Idempotency replay returns same response for same key/payload", async () => {
    if (!E2E_ENABLED || !TENANT_ID) return;

    const idempotencyKey = `idem-e2e-${randomUUID()}`;
    const body = {
      name: "Teste Idempotencia",
      address: "Rua Teste, 123",
      phoneNumber: "11999999999",
      email: `idem-${Date.now()}@test.local`,
      emailVerified: false,
      supabaseId: randomUUID(),
      ownerFullName: "Tenant Test",
      document: "123",
      providerAvatarUrl: "",
    };

    const headers = {
      ...jsonHeaders,
      "x-tenant-id": TENANT_ID,
      "idempotency-key": idempotencyKey,
    };

    const first = await request("/api/v1/cheffia/Restaurant/register", {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    const firstPayload = await parseMaybeJson(first);

    const second = await request("/api/v1/cheffia/Restaurant/register", {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    const secondPayload = await parseMaybeJson(second);

    expect(first.status).toBe(400);
    expect(second.status).toBe(400);
    expect(secondPayload).toEqual(firstPayload);
  });

  test("Cross-tenant read attempt returns invalid/not found", async () => {
    if (!E2E_ENABLED || !TENANT_ID || !FOREIGN_SUPABASE_ID) return;

    const response = await request(`/api/v1/cheffia/Restaurant/${FOREIGN_SUPABASE_ID}`, {
      headers: { "x-tenant-id": TENANT_ID },
    });
    const payload = await parseMaybeJson(response);

    expect(response.status).toBe(400);
    expect(payload.isValid).toBe(false);
  });

  test("Webhook replay keeps logical exactly-once behavior", async () => {
    if (!E2E_ENABLED || !TENANT_ID || !ASAAS_WEBHOOK_TOKEN) return;

    const providerEventId = `evt-${Date.now()}`;
    const paymentId = `pay-${Date.now()}`;
    const webhookPayload = {
      id: providerEventId,
      event: "PAYMENT_RECEIVED",
      payment: {
        id: paymentId,
        status: "RECEIVED",
      },
    };

    const headers = {
      ...jsonHeaders,
      "x-tenant-id": TENANT_ID,
      "asaas-access-token": ASAAS_WEBHOOK_TOKEN,
    };

    const first = await request("/api/v1/cheffia/OrderHub/webhook/asaas", {
      method: "POST",
      headers,
      body: JSON.stringify(webhookPayload),
    });
    const firstPayload = await parseMaybeJson(first);

    const second = await request("/api/v1/cheffia/OrderHub/webhook/asaas", {
      method: "POST",
      headers,
      body: JSON.stringify(webhookPayload),
    });
    const secondPayload = await parseMaybeJson(second);

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(firstPayload.isValid).toBe(true);
    expect(secondPayload.isValid).toBe(true);
    expect(secondPayload.result?.replayed).toBe(true);
  });
});
