import { createHmac } from "node:crypto"

function base64url(value: string) {
  return Buffer.from(value).toString("base64url")
}

export function createSupabaseRealtimeToken(input: {
  sessionId: string
  jwtSecret: string
  now?: Date
}) {
  if (!input.jwtSecret) {
    throw new Error("SUPABASE_JWT_SECRET is required")
  }

  const issuedAt = Math.floor((input.now ?? new Date()).getTime() / 1000)
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }))
  const payload = base64url(JSON.stringify({
    role: "anon",
    table_session_id: input.sessionId,
    iat: issuedAt,
    exp: issuedAt + 300,
  }))
  const unsigned = `${header}.${payload}`
  const signature = createHmac("sha256", input.jwtSecret).update(unsigned).digest("base64url")

  return `${unsigned}.${signature}`
}
