"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { InternalUsersService, isCorporateBackofficeEmail } from "@/app/api/useCases/backoffice";

const BOOTSTRAP_ADMIN_EMAIL = "matheuswillock@cheffia-tech.com";
const BOOTSTRAP_ADMIN_FULL_NAME = "Matheus Willock";

const redirectWithError = (message: string): never =>
  redirect(`/backoffice/sign-in?error=${encodeURIComponent(message)}`);

export async function backofficeSignIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirectWithError("Informe e-mail corporativo e senha.");
  }

  if (!isCorporateBackofficeEmail(email)) {
    redirectWithError("Use seu e-mail @cheffia-tech.com para entrar.");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user?.id) {
    redirectWithError("Credenciais invalidas.");
  }

  const authUser = data.user!;

  const service = new InternalUsersService();
  const internalUser = await service.findBySupabaseUserId(authUser.id);

  if (!internalUser || !internalUser.isActive) {
    await supabase.auth.signOut();
    redirectWithError("Seu acesso interno nao esta habilitado.");
  }

  await service.recordLogin(authUser.id);
  revalidatePath("/backoffice", "layout");
  redirect("/backoffice/dashboard");
}

export async function backofficeSignOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/backoffice", "layout");
  redirect("/backoffice/sign-in");
}

export async function bootstrapBackofficeAdmin(formData: FormData) {
  const password = String(formData.get("password") ?? "");

  if (!password) {
    redirectWithError("Informe a senha inicial do CEO.");
  }

  const service = new InternalUsersService();
  const output = await service.bootstrapAdmin({
    email: BOOTSTRAP_ADMIN_EMAIL,
    fullName: BOOTSTRAP_ADMIN_FULL_NAME,
    password,
    jobTitle: "Chief Executive Officer",
    department: "Executive",
    role: "admin",
  });

  if (!output.isValid) {
    redirectWithError(output.errorMessages[0] ?? "Nao foi possivel criar o admin inicial.");
  }

  revalidatePath("/backoffice/sign-in");
  redirect("/backoffice/sign-in?error=Primeiro admin criado. Agora faca login.");
}

