const DEFAULT_APP_URL = "http://localhost:3000";

const toAbsoluteUrl = (value: string | null | undefined): string | null => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    const normalized = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    return new URL(normalized).toString().replace(/\/$/, "");
  } catch {
    return null;
  }
};

export const normalizeRelativeAppPath = (
  input: string | null | undefined,
  fallback = "/"
): string => {
  if (!input) return fallback;
  const trimmed = input.trim();
  if (!trimmed) return fallback;

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const parsed = new URL(trimmed);
      return `${parsed.pathname}${parsed.search}${parsed.hash}` || fallback;
    } catch {
      return fallback;
    }
  }

  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
};

export const resolvePublicAppUrl = (preferred?: string | null): string =>
  toAbsoluteUrl(preferred) ??
  toAbsoluteUrl(process.env.NEXT_PUBLIC_APP_URL) ??
  toAbsoluteUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL) ??
  toAbsoluteUrl(process.env.VERCEL_URL) ??
  DEFAULT_APP_URL;

export const buildAppUrl = (path: string, preferred?: string | null): string =>
  `${resolvePublicAppUrl(preferred)}${normalizeRelativeAppPath(path)}`;
