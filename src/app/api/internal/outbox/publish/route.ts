import { timingSafeEqual } from "node:crypto"
import { publishPendingOutbox } from "@/server/ordering/publishOutbox"

export const dynamic = "force-dynamic"

function authorized(value: string | null) {
  const secret = process.env.CRON_SECRET
  if (!secret || !value?.startsWith("Bearer ")) return false
  const actual = Buffer.from(value.slice(7))
  const expected = Buffer.from(secret)
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}

export async function POST(request: Request) {
  if (!authorized(request.headers.get("authorization"))) return Response.json({ code: "UNAUTHORIZED" }, { status: 401 })
  try {
    return Response.json(await publishPendingOutbox(), { headers: { "Cache-Control": "no-store" } })
  } catch {
    console.error("Outbox publisher unavailable")
    return Response.json({ code: "OUTBOX_PUBLISHER_UNAVAILABLE" }, { status: 503 })
  }
}
