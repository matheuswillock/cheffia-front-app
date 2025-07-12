import { NextResponse, type NextRequest } from 'next/server';
import { createClient, updateSession } from '@/utils/supabase/middleware';
import { protectedRoutes, authRoutes } from '@/lib/authRoutes';
// import { updateSession } from '@/utils/supabase/middleware';
// import { NextResponse, type NextRequest } from 'next/server';
// // import { createClient } from '@/utils/supabase/middleware';

// const publicRoutes = ['/', '/signin', '/signup', '/menu-live'];

// export async function middleware(request: NextRequest) {
//   const pathname = request.nextUrl.pathname;

//   const isPublic = protectedRoutes.some(route => pathname === route || pathname.startsWith(route + '/'));
//   if (isPublic) {
//     return await updateSession(request);
//   }

//   return await updateSession(request);
// }

// export const config = {
//   matcher: [
//     '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
//   ],
// };


export async function middleware(request: NextRequest) {
  const { supabase, response } = createClient(request);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  const isProtectedRoute = protectedRoutes.some((route) => 
    pathname.startsWith(route)
  );

  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  if (!user && isProtectedRoute) {
    const redirectUrl = new URL('/sign-in', request.url);
    redirectUrl.searchParams.set('redirect_to', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard/', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
      * Runs the middleware on all routes except those starting with:
      * - _next/static (static files)
      * - _next/image (image optimization files)
      * - favicon.ico (favicon icon)
      * - auth/callback, auth/confirm (Supabase callback routes)
      * - files with image extensions (svg, png, jpg, etc.)
      * This is an efficient pattern to avoid unnecessary middleware executions.
    */
    '/((?!_next/static|_next/image|favicon.ico|auth/callback|auth/confirm|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};