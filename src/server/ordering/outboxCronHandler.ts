import { jsonWithRequestId } from "./requestContext"
import { timingSafeEqual } from "node:crypto"

function authorized(secret: string | undefined, header: string | null) {
  if (!secret || !header?.startsWith("Bearer ")) return false
  const actual = Buffer.from(header.slice(7))
  const expected = Buffer.from(secret)
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}

export function createOutboxCronHandler(input: {
  secret: string | undefined
  publish: () => Promise<unknown>
}) {
  return async function handle(request: Request) {
    if (!authorized(input.secret, request.headers.get("authorization"))) {
      return jsonWithRequestId(request, { code: "UNAUTHORIZED" }, { status: 401 })
    }

    try {
      return jsonWithRequestId(request, await input.publish(), { headers: { "Cache-Control": "no-store" } })
    } catch {
      console.error("Outbox publisher unavailable")
      return jsonWithRequestId(request, { code: "OUTBOX_PUBLISHER_UNAVAILABLE" }, { status: 503 })
    }
  }
}
