import { TenantContextError } from "./errors";

export type TenantSource =
  | "header:x-tenant-id"
  | "route:tenantId"
  | "query:tenantId"
  | "jwt"
  | "restaurantId-resolver";

export interface TenantContext {
  tenantId: string;
  source: TenantSource;
  requestId: string | null;
  restaurantId: string | null;
}

export interface ResolveTenantContextOptions {
  request: Request;
  routeParams?: Record<string, string | undefined>;
  resolveTenantIdFromRestaurantId?: (restaurantId: string) => Promise<string | null>;
}

type Candidate = {
  value: string;
  source: TenantSource;
};

const TENANT_ID_REGEX = /^[a-zA-Z0-9_-]{3,80}$/;

const safeTrim = (value: string | null | undefined): string | null => {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const isValidTenantId = (value: string): boolean => TENANT_ID_REGEX.test(value);

const parseBearerToken = (authorization: string | null): string | null => {
  if (!authorization) return null;
  const [scheme, token] = authorization.split(" ");
  if (!scheme || !token) return null;
  if (scheme.toLowerCase() !== "bearer") return null;
  return token.trim() || null;
};

const decodeJwtPayload = (token: string): Record<string, unknown> | null => {
  const segments = token.split(".");
  if (segments.length < 2) return null;

  try {
    const payloadBase64Url = segments[1];
    const payloadBase64 = payloadBase64Url.replace(/-/g, "+").replace(/_/g, "/");
    const padded = payloadBase64.padEnd(payloadBase64.length + ((4 - (payloadBase64.length % 4)) % 4), "=");
    const json = Buffer.from(padded, "base64").toString("utf8");
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
};

const getTenantFromClaims = (claims: Record<string, unknown> | null): string | null => {
  if (!claims) return null;

  const direct =
    safeTrim(String(claims.tenant_id ?? "")) ??
    safeTrim(String(claims.tenantId ?? "")) ??
    safeTrim(String(claims["https://cheffia.com/tenant_id"] ?? ""));

  if (direct) return direct;

  const appMetadata = claims.app_metadata;
  if (appMetadata && typeof appMetadata === "object") {
    return safeTrim(String((appMetadata as Record<string, unknown>).tenant_id ?? ""));
  }

  return null;
};

const getRestaurantId = (request: Request, routeParams?: Record<string, string | undefined>): string | null => {
  const url = new URL(request.url);
  const fromRoute = safeTrim(routeParams?.restaurantId ?? null);
  if (fromRoute) return fromRoute;

  const fromQuery = safeTrim(url.searchParams.get("restaurantId"));
  if (fromQuery) return fromQuery;

  return safeTrim(request.headers.get("x-restaurant-id"));
};

const chooseTenantCandidate = (candidates: Candidate[]): Candidate | null => {
  const normalized = candidates.map((candidate) => ({
    ...candidate,
    value: candidate.value.trim(),
  }));

  const values = Array.from(new Set(normalized.map((candidate) => candidate.value)));
  if (!values.length) return null;

  if (values.length > 1) {
    const detail = normalized.map((candidate) => `${candidate.source}=${candidate.value}`).join(", ");
    throw new TenantContextError(
      "TENANT_CONTEXT_CONFLICT",
      `Conflicting tenant context detected: ${detail}`
    );
  }

  return normalized[0];
};

export const resolveTenantContext = async (
  options: ResolveTenantContextOptions
): Promise<TenantContext> => {
  const { request, routeParams, resolveTenantIdFromRestaurantId } = options;
  const url = new URL(request.url);

  const headerTenantId = safeTrim(request.headers.get("x-tenant-id"));
  const routeTenantId = safeTrim(routeParams?.tenantId ?? null);
  const queryTenantId = safeTrim(url.searchParams.get("tenantId"));

  const token = parseBearerToken(request.headers.get("authorization"));
  const jwtTenantId = getTenantFromClaims(token ? decodeJwtPayload(token) : null);

  const candidates: Candidate[] = [];

  if (headerTenantId) candidates.push({ value: headerTenantId, source: "header:x-tenant-id" });
  if (routeTenantId) candidates.push({ value: routeTenantId, source: "route:tenantId" });
  if (queryTenantId) candidates.push({ value: queryTenantId, source: "query:tenantId" });
  if (jwtTenantId) candidates.push({ value: jwtTenantId, source: "jwt" });

  let chosen = chooseTenantCandidate(candidates);

  const restaurantId = getRestaurantId(request, routeParams);
  if (!chosen && restaurantId && resolveTenantIdFromRestaurantId) {
    const resolvedTenantId = safeTrim(await resolveTenantIdFromRestaurantId(restaurantId));

    if (resolvedTenantId) {
      chosen = {
        value: resolvedTenantId,
        source: "restaurantId-resolver",
      };
    }
  }

  if (!chosen) {
    throw new TenantContextError(
      "TENANT_CONTEXT_MISSING",
      "Tenant context is required. Provide x-tenant-id, tenantId param/query, JWT claim, or a restaurantId resolver."
    );
  }

  if (!isValidTenantId(chosen.value)) {
    throw new TenantContextError(
      "TENANT_CONTEXT_INVALID",
      `Invalid tenant identifier: ${chosen.value}`
    );
  }

  return {
    tenantId: chosen.value,
    source: chosen.source,
    requestId: safeTrim(request.headers.get("x-request-id")),
    restaurantId,
  };
};

export const requireTenantContext = async (
  options: ResolveTenantContextOptions
): Promise<TenantContext> => resolveTenantContext(options);
