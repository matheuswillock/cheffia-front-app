'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/utils/supabase/server';
import { isRedirectError } from 'next/dist/client/components/redirect-error';

async function getSupabaseClient() {
  return await createClient();
}

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

    console.log('supabase:', supabase)

    const credentials = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    }

    console.log('signIn | credentials:', credentials)

    const { data, error } = await supabase.auth.signInWithPassword(credentials)

    console.log('signIn | data:', data)
    console.log('signIn | error:', error)

    if (error) {
      redirect('/error')
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')

  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    console.error('signIn | error:', error)
    redirect('/error')
  }
}

export async function signUp(formData: FormData) {
  const supabase = await getSupabaseClient();

  const credentials = {
    email: formData.get('email') as string,
    password: formData.get('password') as string
  }

  const { error } = await supabase.auth.signUp(credentials)

  console.log('Actions -> signUp | error:', error)

  if (error) {
    redirect('/error')
  }

  revalidatePath('/', 'layout')
  redirect('/register/restaurant')
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

  redirect('/register/restaurant')
};
