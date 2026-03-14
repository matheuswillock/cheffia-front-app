import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "bun:test";

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(TEST_DIR, "..", "..");
const OPENAPI_FILE = path.join(ROOT_DIR, "app", "api", "openapi", "openapi.json");

const expectedRoutes = [
  { method: "post", path: "/api/v1/auth/forgot-password" },
  { method: "post", path: "/api/v1/auth/resend-confirmation" },
  { method: "post", path: "/api/v1/cheffia/Restaurant/register" },
  { method: "get", path: "/api/v1/cheffia/Restaurant/{restaurantId}/financial-account/summary" },
  { method: "get", path: "/api/v1/cheffia/Restaurant/{supabaseId}" },
  { method: "get", path: "/api/v1/cheffia/Restaurant/confirm-email" },
  { method: "delete", path: "/api/v1/cheffia/Restaurant/{restaurantId}/delete" },
  { method: "post", path: "/api/v1/cheffia/Menu/items/add" },
  { method: "delete", path: "/api/v1/cheffia/Menu/items/delete" },
  { method: "delete", path: "/api/v1/cheffia/Menu/items/delete/{itemId}" },
  { method: "get", path: "/api/v1/cheffia/Menu/get" },
  { method: "post", path: "/api/v1/cheffia/Menu/get" },
  { method: "get", path: "/api/v1/cheffia/MenuLive" },
  { method: "post", path: "/api/v1/cheffia/OrderHub/send" },
  { method: "get", path: "/api/v1/cheffia/OrderHub/order" },
  { method: "post", path: "/api/v1/cheffia/OrderHub/payment" },
  { method: "post", path: "/api/v1/cheffia/OrderHub/payment/confirmation" },
  { method: "post", path: "/api/v1/cheffia/OrderHub/print/jobs/claim" },
  { method: "post", path: "/api/v1/cheffia/OrderHub/print/jobs/complete" },
  { method: "post", path: "/api/v1/cheffia/OrderHub/print/jobs/reprint" },
  { method: "post", path: "/api/v1/cheffia/OrderHub/webhook/asaas" },
  { method: "post", path: "/api/v1/cheffia/Payment/intent/create" },
  { method: "post", path: "/api/v1/cheffia/Payment/product/create" },
];

const idempotentRoutes = [
  { method: "post", path: "/api/v1/cheffia/Restaurant/register" },
  { method: "delete", path: "/api/v1/cheffia/Restaurant/{restaurantId}/delete" },
  { method: "post", path: "/api/v1/cheffia/Menu/items/add" },
  { method: "delete", path: "/api/v1/cheffia/Menu/items/delete" },
  { method: "delete", path: "/api/v1/cheffia/Menu/items/delete/{itemId}" },
  { method: "post", path: "/api/v1/cheffia/OrderHub/send" },
  { method: "post", path: "/api/v1/cheffia/OrderHub/payment" },
  { method: "post", path: "/api/v1/cheffia/OrderHub/payment/confirmation" },
  { method: "post", path: "/api/v1/cheffia/Payment/intent/create" },
  { method: "post", path: "/api/v1/cheffia/Payment/product/create" },
];

const tenantAwareRoutes = expectedRoutes.filter(
  (route) => route.path.startsWith("/api/v1/cheffia/") && !route.path.includes("/confirm-email")
);

const loadOpenApi = async () => {
  const raw = await readFile(OPENAPI_FILE, "utf8");
  return JSON.parse(raw);
};

const hasHeaderParameter = (operation, headerName, required = null) => {
  const params = Array.isArray(operation?.parameters) ? operation.parameters : [];
  return params.some((param) => {
    if (param.in !== "header" || param.name !== headerName) return false;
    if (required === null) return true;
    return Boolean(param.required) === required;
  });
};

describe("OpenAPI migration contract", () => {
  test("contains metadata", async () => {
    const doc = await loadOpenApi();
    expect(doc.openapi).toBe("3.1.0");
    expect(String(doc.info?.title ?? "")).toContain("Cheffia API v1");
  });

  test("contains all migrated v1 routes", async () => {
    const doc = await loadOpenApi();

    for (const route of expectedRoutes) {
      expect(doc.paths?.[route.path]).toBeDefined();
      expect(doc.paths?.[route.path]?.[route.method]).toBeDefined();
    }
  });

  test("documents idempotency-key for idempotent routes", async () => {
    const doc = await loadOpenApi();

    for (const route of idempotentRoutes) {
      const operation = doc.paths?.[route.path]?.[route.method];
      expect(operation).toBeDefined();
      expect(hasHeaderParameter(operation, "idempotency-key")).toBe(true);
    }
  });

  test("documents x-tenant-id for tenant-aware routes", async () => {
    const doc = await loadOpenApi();

    for (const route of tenantAwareRoutes) {
      const operation = doc.paths?.[route.path]?.[route.method];
      expect(operation).toBeDefined();
      expect(hasHeaderParameter(operation, "x-tenant-id")).toBe(true);
    }
  });

  test("webhook requires x-tenant-id and asaas-access-token", async () => {
    const doc = await loadOpenApi();
    const operation = doc.paths?.["/api/v1/cheffia/OrderHub/webhook/asaas"]?.post;

    expect(operation).toBeDefined();
    expect(hasHeaderParameter(operation, "x-tenant-id", true)).toBe(true);
    expect(hasHeaderParameter(operation, "asaas-access-token", true)).toBe(true);
  });
});
