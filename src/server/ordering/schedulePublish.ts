import { after } from "next/server"

import { publishPendingOutbox } from "@/server/ordering/publishOutbox"

// The outbox row is already committed. Publish right after the response and let
// the cron pick up whatever this attempt could not deliver.
export function schedulePendingOutboxPublish() {
  after(async () => {
    try {
      await publishPendingOutbox()
    } catch {
      console.error("Immediate outbox publish failed; the cron will retry")
    }
  })
}
