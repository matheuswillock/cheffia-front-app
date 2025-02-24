'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function signIn(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    redirect('/error')
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signUp(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string
  }

  // TODO: Add here call to api with user data to register user in the system
  // Validar se houve erro no cadastro, se não segue com a chamada para o sign up

  const { error } = await supabase.auth.signUp(data)

  if (error) {
    redirect('/error')
  }

  // TODO: validar se este revalidate está correto pois aqui é cliente e não server
  // revalidatePath('/', 'layout')
  redirect('/register/restaurant')
}

const authenticateWithOAuth = async () => {
  const supabase = await createClient();
  // const origin = (await headers()).get("origin");

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `http://localhost:3000/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  if (error) {
    console.error("Erro no authenticateWithOAuth", error.message);
    return redirect("/sign-in");
  }

  return data;
}

export const signInActionWithProvider = async () => {
  const data = await authenticateWithOAuth();

  console.log("atenticando com provider", data);

  if (data.url) {
    return redirect(data.url);
  }

  return redirect("/dashboard");
};

export const signUpActionWithProvider = async () => {
  const data = await authenticateWithOAuth();

  if (data.url) {
    return redirect(data.url);
  }

  redirect('/register/restaurant')
};
