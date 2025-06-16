import { updateSession } from '@/utils/supabase/middleware';
import { type NextRequest } from 'next/server';

const publicRoutes = ['/', '/signin', '/signup', '/menu-live'];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Permite todas rotas públicas (inclusive /menu-live/slug)
  const isPublic = publicRoutes.some(route => pathname === route || pathname.startsWith(route + '/'));
  if (isPublic) {
    return await updateSession(request);
  }

  // Para as demais, garante proteção
  return await updateSession(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
