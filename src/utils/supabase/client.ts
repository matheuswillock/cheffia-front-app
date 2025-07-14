import { unauthorized } from '@/lib/utils';
import { createBrowserClient } from '@supabase/ssr'

export async function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function verifySessionClient() {
  const { auth } = await createClient();
  const { error, data: { user } } = await auth.getUser();

  if (error || !user) unauthorized();

  return user;
}

