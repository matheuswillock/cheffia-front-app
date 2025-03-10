import { NextResponse } from 'next/server';
import { checkUserSession, createClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/register/restaurant';

  if (code) {
    const supabase = await createClient();
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);

    // // TODO: ADD LOGS
    // console.log('GET -> createClient | data', data)
    // console.log('GET -> createClient | error', error)

    // console.log('GET -> createClient | Next', next)
    // console.log('GET -> createClient | origin', origin)
    // console.log('GET -> createClient | searchParams', searchParams)

    if (!error) {
      const forwardedHost = request.headers.get('x-forwarded-host');
      const isLocalEnv = process.env.NODE_ENV === 'development';

      // TODO: add validate ID to redirect to /register/restaurant or to /dashboard
      await checkUserSession();            

      const redirectUrl = next;

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