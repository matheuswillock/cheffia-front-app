import "server-only";

import type { EmailOtpType, User } from "@supabase/supabase-js";
import { getSupabaseAdminClient } from "@/app/api/infra/supabase/adminClient";
import { buildAppUrl, normalizeRelativeAppPath } from "./url";

interface AuthLinkInput {
  email: string;
  nextPath: string;
  appBaseUrl?: string | null;
}

interface GeneratedAuthEmailLink {
  email: string;
  deliveryUrl: string;
  supabaseUser: User;
  verificationType: EmailOtpType;
}

const buildOtpRedirectUrl = (
  tokenHash: string,
  verificationType: EmailOtpType,
  nextPath: string,
  appBaseUrl?: string | null
): string => {
  const url = new URL(buildAppUrl("/auth/confirm", appBaseUrl));
  url.searchParams.set("token_hash", tokenHash);
  url.searchParams.set("type", verificationType);
  url.searchParams.set("next", normalizeRelativeAppPath(nextPath));
  return url.toString();
};

const generateAuthEmailLink = async (
  params:
    | { type: "recovery"; email: string; nextPath: string; appBaseUrl?: string | null }
    | { type: "magiclink"; email: string; nextPath: string; appBaseUrl?: string | null }
): Promise<GeneratedAuthEmailLink> => {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.auth.admin.generateLink({
    type: params.type,
    email: params.email,
  });

  if (error || !data.properties || !data.user) {
    throw new Error(error?.message ?? `Failed to generate ${params.type} auth link.`);
  }

  const verificationType = data.properties.verification_type as EmailOtpType;

  return {
    email: params.email,
    deliveryUrl: buildOtpRedirectUrl(
      data.properties.hashed_token,
      verificationType,
      params.nextPath,
      params.appBaseUrl
    ),
    supabaseUser: data.user,
    verificationType,
  };
};

export const createPasswordRecoveryLink = async (
  input: AuthLinkInput
): Promise<GeneratedAuthEmailLink> =>
  generateAuthEmailLink({
    type: "recovery",
    email: input.email.trim().toLowerCase(),
    nextPath: input.nextPath,
    appBaseUrl: input.appBaseUrl,
  });

export const createEmailConfirmationLink = async (
  input: AuthLinkInput
): Promise<GeneratedAuthEmailLink> =>
  generateAuthEmailLink({
    type: "magiclink",
    email: input.email.trim().toLowerCase(),
    nextPath: input.nextPath,
    appBaseUrl: input.appBaseUrl,
  });

export const getDisplayNameFromSupabaseUser = (
  user: Pick<User, "email" | "user_metadata">,
  fallbackEmail?: string | null
): string => {
  const metadata = user.user_metadata ?? {};
  const candidates = [
    typeof metadata.full_name === "string" ? metadata.full_name : null,
    typeof metadata.name === "string" ? metadata.name : null,
    typeof metadata.first_name === "string" ? metadata.first_name : null,
    user.email,
    fallbackEmail,
  ];

  for (const candidate of candidates) {
    const normalized = String(candidate ?? "").trim();
    if (normalized) return normalized;
  }

  return "Cheffia";
};
