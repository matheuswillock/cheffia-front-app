export interface UpsertUserProfileInput {
  supabaseUserId: string;
  email: string;
  fullName: string;
  birthDate: string;
  document: string;
  role: string;
  jobTitle: string;
  department: string;
  avatarUrl?: string | null;
}

export interface UserProfileOutput {
  id: string;
  supabaseUserId: string;
  email: string;
  fullName: string;
  birthDate: string;
  document: string;
  role: string;
  jobTitle: string;
  department: string;
  cheffiaId: string;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}
