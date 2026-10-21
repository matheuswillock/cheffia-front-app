import { createOutboxCronHandler } from "@/server/ordering/outboxCronHandler"
import { publishPendingOutbox } from "@/server/ordering/publishOutbox"

export const dynamic = "force-dynamic"

function handle(request: Request) {
  return createOutboxCronHandler({
    secret: process.env.CRON_SECRET,
    publish: () => publishPendingOutbox(),
  })(request)
}

// Vercel Cron calls GET; POST stays available for manual runs.
export const GET = handle
export const POST = handle
