import type { User } from "@supabase/supabase-js"

import { redirectWithRequestId } from "@/server/ordering/requestContext"
import { createClient } from "@/utils/supabase/server"

export type RouteSession = { ok: true; user: User } | { ok: false; response: Response }

// Same decision as verifySessionServer (no user -> redirect to /unauthorized), but it returns the
// response instead of throwing Next's auth interrupt, so the redirect can carry X-Request-Id.
export async function requireRouteSession(request: Request): Promise<RouteSession> {
  const supabase = await createClient()
  const { error, data: { user } } = await supabase.auth.getUser()

  if (error || !user) {
    return { ok: false, response: redirectWithRequestId(request, "/unauthorized") }
  }

  return { ok: true, user }
}
