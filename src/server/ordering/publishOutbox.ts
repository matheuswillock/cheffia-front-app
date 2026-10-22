import { publishOrderOutboxEvent } from "@/business/order/publishOutbox"
import { createClient } from "@supabase/supabase-js"
import type { PrismaClient } from "@/generated/prisma/client"
import { getPrismaClient } from "@/server/infra/prisma/client"
import { createOutboxPublisherRepository } from "@/server/ordering/outboxPublisherRepository"

async function broadcast(topic: string, payload: unknown) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const secret = process.env.SUPABASE_SECRET_KEY
  if (!url || !secret) throw new Error("SUPABASE_SECRET_KEY and NEXT_PUBLIC_SUPABASE_URL are required")
  const client = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } })
  const channel = client.channel(topic, { config: { private: true } })
  try {
    const result = await channel.send({ type: "broadcast", event: "order.updated", payload })
    if (result !== "ok") throw new Error(`Broadcast returned ${result}`)
  } finally {
    await client.removeChannel(channel)
  }
}

type PublishPendingOutboxOptions = {
  batchSize?: number
  // Defaults keep the production behavior: the shared Prisma client and Supabase Broadcast.
  prisma?: PrismaClient
  publish?: (topic: string, payload: unknown) => Promise<void>
}

export async function publishPendingOutbox({
  batchSize = 50,
  prisma = getPrismaClient(),
  publish = broadcast,
}: PublishPendingOutboxOptions = {}) {
  const repository = createOutboxPublisherRepository(prisma)
  const events = await repository.claim(batchSize)
  let published = 0
  let failed = 0
  for (const event of events) {
    try {
      await publishOrderOutboxEvent({ event, publish })
      await repository.markPublished(event)
      published += 1
    } catch (error) {
      await repository.release(event, error)
      failed += 1
    }
  }
  return { claimed: events.length, published, failed }
}
