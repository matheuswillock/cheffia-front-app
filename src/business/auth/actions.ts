'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createEmailConfirmationLink, getEmailService } from '@/server/application/email';
import { createClient } from '@/utils/supabase/server';
import { getSupabaseAdminClient } from '@/server/infra/supabase/adminClient';
import { UserProfileService } from '@/server/application/userProfiles';

async function getSupabaseClient() {
  return await createClient();
}

const readStringFormField = (formData: FormData, key: string): string =>
  String(formData.get(key) ?? "").trim();

const sendSignUpConfirmationEmail = async ({
  email,
  fullName,
  supabaseUserId,
  appBaseUrl,
}: {
  email: string;
  fullName: string;
  supabaseUserId: string;
  appBaseUrl?: string | null;
}): Promise<void> => {
  try {
    const link = await createEmailConfirmationLink({
      email,
      nextPath: "/register/restaurant",
      appBaseUrl,
    });

    const delivery = await getEmailService().sendEmailConfirmationEmail(
      {
        userName: fullName,
        userEmail: email,
        confirmationUrl: link.deliveryUrl,
      },
      { supabaseUserId }
    );

    if (!delivery.success) {
      console.error("auth.sign_up.confirmation_email_failed", {
        supabaseUserId,
        message: delivery.error,
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown confirmation email error";
    console.error("auth.sign_up.confirmation_email_failed", {
      supabaseUserId,
      message,
    });
  }
};

const buildUserProfileInputFromForm = (
  formData: FormData,
  user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> | null }
) => ({
  supabaseUserId: user.id,
  email: user.email ?? readStringFormField(formData, "email"),
  fullName: readStringFormField(formData, "fullName"),
  birthDate: readStringFormField(formData, "birthDate"),
  document: readStringFormField(formData, "document"),
  role: readStringFormField(formData, "role"),
  jobTitle: readStringFormField(formData, "jobTitle"),
  department: readStringFormField(formData, "department"),
  avatarUrl:
    typeof user.user_metadata?.avatar_url === "string"
      ? user.user_metadata.avatar_url
      : null,
});

const authenticateWithOAuth = async (authType: string) => {
  const supabase = await getSupabaseClient();
  const origin = (await headers()).get("origin");

  // TODO: add roteamento para o callback de acordo com o tipo de autenticação (sign-in ou sign-up)
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  // console.log('actions -> authenticateWithOAuth | data:', data)
  // console.log('actions -> authenticateWithOAuth | error:', error)

  if (error) {
    console.error("Erro no authenticateWithOAuth", error.message);
    return redirect("/sign-in");
  }

  return data;
};

export async function signIn(formData: FormData) {
  try {
    console.log('signIn | formData:', formData)

    const supabase = await getSupabaseClient();
    const profileService = new UserProfileService();

    console.log('supabase:', supabase)

    const credentials = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    }

    console.log('signIn | credentials:', credentials)

    const { data, error } = await supabase.auth.signInWithPassword(credentials)

    console.log('signIn | data:', data)
    console.log('signIn | error:', error)

    if (error || !data.user) {
      redirect('/error')
    }

    revalidatePath('/', 'layout')
    redirect(await profileService.resolvePostAuthDestination(data.user.id))

  } catch (error) {
    console.error('signIn | error:', error)
    redirect('/error')
  }
}

export async function signUp(formData: FormData) {
  const supabase = await getSupabaseClient();
  const profileService = new UserProfileService();
  const requestHeaders = await headers();
  const appBaseUrl = requestHeaders.get("origin");

  const credentials = {
    email: readStringFormField(formData, 'email'),
    password: readStringFormField(formData, 'password')
  }

  const { error, data } = await supabase.auth.signUp({
    ...credentials,
    options: {
      data: {
        full_name: readStringFormField(formData, "fullName"),
      },
    },
  })

  console.log('Actions -> signUp | error:', error)

  if (error || !data.user) {
    redirect('/error')
  }

  const profile = await profileService.upsert(
    buildUserProfileInputFromForm(formData, {
      id: data.user.id,
      email: data.user.email,
      user_metadata: data.user.user_metadata,
    })
  );

  if (!profile.isValid) {
    try {
      const adminClient = getSupabaseAdminClient();
      await adminClient.auth.admin.deleteUser(data.user.id);
    } catch (cleanupError) {
      console.error("signUp | failed to cleanup auth user after profile failure", cleanupError);
    }

    console.error("signUp | failed to save user profile", profile.errorMessages);
    redirect('/error');
  }

  if (!data.user.email_confirmed_at) {
    await sendSignUpConfirmationEmail({
      email: credentials.email,
      fullName: readStringFormField(formData, "fullName"),
      supabaseUserId: data.user.id,
      appBaseUrl,
    });
  }

  revalidatePath('/', 'layout')
  redirect('/register/restaurant')
}

export async function completeUserProfile(formData: FormData) {
  const supabase = await getSupabaseClient();
  const profileService = new UserProfileService();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      isValid: false,
      successMessages: [],
      errorMessages: ["Usuario autenticado nao encontrado"],
      result: null,
    };
  }

  const output = await profileService.upsert(
    buildUserProfileInputFromForm(formData, {
      id: user.id,
      email: user.email,
      user_metadata: user.user_metadata,
    })
  );

  if (output.isValid) {
    revalidatePath('/', 'layout');
  }

  return output;
}

export const signInActionWithProvider = async () => {
  const data = await authenticateWithOAuth('sign-in');

  if (data.url) {
    return redirect(data.url);
  }

  return redirect("/dashboard");
};

export const signUpActionWithProvider = async () => {
  const data = await authenticateWithOAuth('sign-up');

  const origin = (await headers()).get("origin");

  console.log('origin:', origin)
  console.log('data:', data)

  if (data.url) {
    return redirect(data.url);
  }

  redirect('/register/profile')
};
