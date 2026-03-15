import type { UserProfileRole } from "@/lib/userProfileRole";

export interface UpsertUserProfileInput {
  supabaseUserId: string;
  email: string;
  fullName: string;
  birthDate: string;
  document: string;
  role: UserProfileRole;
  avatarUrl?: string | null;
}

export interface UserProfileOutput {
  id: string;
  supabaseUserId: string;
  email: string;
  fullName: string;
  birthDate: string;
  document: string;
  role: UserProfileRole;
  cheffiaId: string;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

