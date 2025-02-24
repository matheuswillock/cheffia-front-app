import { createBrowserClient } from '@supabase/ssr'
import { redirect } from 'next/navigation';

export async function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function checkUserSession() {
  const supabase = await createClient();

  const {
    error,
    data: { user }
  } = await supabase.auth.getUser();

  if (error || !user) {
    return redirect("/sign-in");
  }

  return user;
}