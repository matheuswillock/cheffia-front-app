// utils/supabase/middleware.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();
  
  const isAuthRoute = ['/sign-in', '/sign-up', '/menu-live', '/'].some(path =>
    request.nextUrl.pathname.startsWith(path)
  );

  if (!session && !isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/sign-in';
    return NextResponse.redirect(url);
  }

  return response;
}

// import { createServerClient } from '@supabase/ssr';
// import { NextResponse, type NextRequest } from 'next/server';

// export async function updateSession(request: NextRequest) {

// Toda vez que o middleware é chamado, ele cria um objeto supabase
// que é usado para verificar a sessão do usuário e atualizar os cookies.

//   let supabaseResponse = NextResponse.next({ request });

//   const supabase = createServerClient(
//     process.env.NEXT_PUBLIC_SUPABASE_URL!,
//     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
//     {
//       cookies: {
//         getAll() {
//           return request.cookies.getAll();
//         },
//         setAll(cookiesToSet) {
//           cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));

// O objeto é recriado a cada chamada do middleware, o que pode ser ineficiente.

//           supabaseResponse = NextResponse.next({ request });
//           cookiesToSet.forEach(({ name, value, options }) =>
//             supabaseResponse.cookies.set(name, value, options)
//           );
//         },
//       },
//     }
//   );

// A session já traz o usuário, então não é necessário fazer outra chamada para obter o usuário.

//   const {
//     data: { user },
//   } = await supabase.auth.getUser();

//   const {
//     data: { session },
//   } = await supabase.auth.getSession();
  
//   const isAuthRoute = ['/sign-in', '/sign-up', '/menu-live', '/'].some(path =>
//     request.nextUrl.pathname.startsWith(path)
//   );

//   if (!session && !user && !isAuthRoute) {
//     const url = request.nextUrl.clone();
//     url.pathname = '/sign-in';
//     return NextResponse.redirect(url);
//   }

//   return supabaseResponse;
// }
