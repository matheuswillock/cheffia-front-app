// src/middleware.ts
import { updateSession } from '@/utils/supabase/middleware';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { session, response } = await updateSession(request);
  const pathname = request.nextUrl.pathname;

  const publicRoutes = ['/', '/sign-in', '/sign-up', '/menu-live'];
  const isPublic = publicRoutes.some(route => 
    pathname === route || (route !== '/' && pathname.startsWith(route + '/'))
  );

  if (!session && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = '/sign-in';
    return NextResponse.redirect(url);
  }

  if (session && (pathname === '/sign-in' || pathname === '/sign-up')) {
    const url = request.nextUrl.clone();
    url.pathname = `/dashboard/${session.user.id}`; 
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

// import { updateSession } from '@/utils/supabase/middleware';
// import { type NextRequest } from 'next/server';

// const publicRoutes = ['/', '/sign-in', '/sign-up', '/menu-live'];

// export async function middleware(request: NextRequest) {
//   const pathname = request.nextUrl.pathname;

//   // Permite todas rotas públicas (inclusive /menu-live/slug)
//   const isPublic = publicRoutes.some(route => pathname === route || pathname.startsWith(route + '/'));
//   if (isPublic) {
//     return await updateSession(request);
//   }

//   // Para as demais, garante proteção
//   return await updateSession(request);
// }

// export const config = {
//   matcher: [
//     '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
//   ],
// };
