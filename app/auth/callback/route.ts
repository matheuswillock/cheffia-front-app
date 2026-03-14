import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { UserProfileService } from '@/app/api/useCases/userProfiles';
import { RestaurantService } from '@/app/api/useCases/restaurant';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (code) {
    const supabase = await createClient();
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);

    // // TODO: ADD LOGS
    if (!error && data.user) {
      const forwardedHost = request.headers.get('x-forwarded-host');
      const isLocalEnv = process.env.NODE_ENV === 'development';
      const profileService = new UserProfileService();
      const restaurantService = new RestaurantService();

      try {
        await restaurantService.syncEmailVerifiedFromAuthState(data.user.id);
      } catch (syncError) {
        const message =
          syncError instanceof Error ? syncError.message : 'Unknown email sync error';
        console.error('auth.callback.email_sync_failed', {
          supabaseUserId: data.user.id,
          message,
        });
      }

      const redirectUrl =
        searchParams.get('next') ??
        (await profileService.resolvePostAuthDestination(data.user.id));

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
