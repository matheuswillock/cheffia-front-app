import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import type { BackofficeRole, BackofficeUserOutput } from "./types";
import { InternalUsersService } from "./internalUsersService";

const CORPORATE_DOMAIN = "@cheffia-tech.com";

export class BackofficeAccessError extends Error {
  constructor(
    message: string,
    public readonly statusCode: 401 | 403 = 403
  ) {
    super(message);
  }
}

const hasCorporateEmail = (email: string | undefined): boolean =>
  !!email && email.trim().toLowerCase().endsWith(CORPORATE_DOMAIN);

const roleAllowed = (
  role: BackofficeRole,
  minimumRole: BackofficeRole | undefined
): boolean => {
  if (!minimumRole || minimumRole === "operator") return true;
  return role === "admin";
};

export interface BackofficeSession {
  authUser: {
    id: string;
    email: string;
  };
  internalUser: BackofficeUserOutput;
}

export async function requireBackofficeUser(options?: {
  minimumRole?: BackofficeRole;
}): Promise<BackofficeSession> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user?.id || !user.email) {
    throw new BackofficeAccessError("Backoffice authentication is required", 401);
  }

  if (!hasCorporateEmail(user.email)) {
    throw new BackofficeAccessError("Corporate email is required for backoffice access", 403);
  }

  const service = new InternalUsersService();
  const internalUser = await service.findBySupabaseUserId(user.id);

  if (!internalUser || !internalUser.isActive) {
    throw new BackofficeAccessError("Internal backoffice access not found", 403);
  }

  if (internalUser.email.toLowerCase() !== user.email.toLowerCase()) {
    throw new BackofficeAccessError("Backoffice user and auth email do not match", 403);
  }

  if (!roleAllowed(internalUser.role, options?.minimumRole)) {
    throw new BackofficeAccessError("Insufficient backoffice permissions", 403);
  }

  return {
    authUser: {
      id: user.id,
      email: user.email,
    },
    internalUser,
  };
}

export async function requireBackofficePage(options?: {
  minimumRole?: BackofficeRole;
}): Promise<BackofficeSession> {
  try {
    return await requireBackofficeUser(options);
  } catch (error) {
    if (error instanceof BackofficeAccessError) {
      if (error.statusCode === 401) {
        redirect("/backoffice/sign-in");
      }

      redirect("/unauthorized");
    }

    throw error;
  }
}

export const isCorporateBackofficeEmail = (email: string): boolean =>
  hasCorporateEmail(email);
