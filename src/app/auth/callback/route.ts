import { NextResponse } from 'next/server';
import { verifySessionServer, createClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (code) {
    const supabase = await createClient();
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);

    // // TODO: ADD LOGS
    if (!error) {
      const forwardedHost = request.headers.get('x-forwarded-host');
      const isLocalEnv = process.env.NODE_ENV === 'development';

      // TODO: add validate ID to redirect to /register/restaurant or to /dashboard
      const redirectUrl = searchParams.get('next') ??
        await verifySessionServer() ? `/dashboard/${data?.user?.id}` : '/register/restaurant';

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