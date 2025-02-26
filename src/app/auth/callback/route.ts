import { NextResponse } from 'next/server';
import { checkUserSession, createClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/register/restaurant';

  if (code) {
    const supabase = await createClient();
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);

    console.log('data', data)

    if (!error) {
      const forwardedHost = request.headers.get('x-forwarded-host');
      const isLocalEnv = process.env.NODE_ENV === 'development';

      // Fetch the user's restaurant slug
      // const { data: user } = await supabase.auth.getUser();

      const { id } = await checkUserSession();      
      
      const redirectUrl = id ? `/dashboard/${id}` : next;

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${redirectUrl}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${redirectUrl}`);
      } else {
        return NextResponse.redirect(`${origin}${redirectUrl}`);
      }
    }
    
  }

  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}