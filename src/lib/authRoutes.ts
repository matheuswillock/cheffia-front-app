/**
* Array of protected routes that require user authentication.
* The middleware will redirect unauthenticated users to the login page.
* @type {string[]}
*/
export const protectedRoutes: string[] = [
  '/dashboard',
  '/register/restaurant',
  '/restaurant',
  '/cheffia-flow',
  '/order/checkout',
  '/account',
];

/**
* Array of authentication routes (login, registration).
* Already authenticated users who attempt to access these routes will be redirected to the dashboard.
* @type {string[]}
*/
export const authRoutes: string[] = [
  '/sign-in',
  '/sign-up'
];

/**
 * Array de rotas públicas que não exigem autenticação.
 * @type {string[]}
 */
export const publicRoutes: string[] = [
  '/',
  '/menu-live',
  '/error',
  '/unauthorized',
];