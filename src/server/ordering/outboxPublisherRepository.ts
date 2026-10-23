import { randomUUID } from "node:crypto"

import type { PendingOutboxEvent } from "@/business/order/publishOutbox"
import type { PrismaClient } from "@/generated/prisma/client"
import { Prisma } from "@/generated/prisma/client"

type ClaimedRow = Omit<PendingOutboxEvent, "leaseToken"> & { lease_token: string }

export function createOutboxPublisherRepository(prisma: PrismaClient) {
  return {
    async claim(limit: number, leaseMs = 120_000): Promise<PendingOutboxEvent[]> {
      const leaseToken = randomUUID()
      const rows = await prisma.$queryRaw<ClaimedRow[]>(Prisma.sql`
        WITH candidates AS (
          SELECT id FROM public.outbox_events
          WHERE aggregate_type = 'order'
            AND ((status = 'pending' AND available_at <= now())
             OR (status = 'processing' AND lease_expires_at <= now())
            )
          ORDER BY sequence
          FOR UPDATE SKIP LOCKED
          LIMIT ${limit}
        )
        UPDATE public.outbox_events event
        SET status = 'processing', lease_token = ${leaseToken}::uuid,
            lease_expires_at = now() + (${leaseMs} * interval '1 millisecond'), updated_at = now()
        FROM candidates
        WHERE event.id = candidates.id
        RETURNING event.id, event.restaurant_id AS "restaurantId", event.aggregate_id AS "aggregateId",
          event.event_type AS "eventType", event.sequence, event.payload, event.lease_token
      `)
      return rows.map((row) => ({ ...row, leaseToken: row.lease_token }))
    },
    async markPublished(event: PendingOutboxEvent) {
      return prisma.$executeRaw(Prisma.sql`
        UPDATE public.outbox_events SET status = 'published', published_at = now(), lease_token = NULL,
          lease_expires_at = NULL, last_error = NULL, updated_at = now()
        WHERE id = ${event.id}::uuid AND status = 'processing' AND lease_token = ${event.leaseToken}::uuid
      `)
    },
    async release(event: PendingOutboxEvent, error: unknown) {
      const message = error instanceof Error ? error.message.slice(0, 1000) : String(error).slice(0, 1000)
      return prisma.$executeRaw(Prisma.sql`
        UPDATE public.outbox_events
        SET retry_count = retry_count + 1,
          status = CASE WHEN retry_count + 1 >= 10 THEN 'failed'::public.outbox_status ELSE 'pending'::public.outbox_status END,
          available_at = now() + (LEAST(3600, power(2, retry_count + 1)::integer) * interval '1 second'),
          lease_token = NULL, lease_expires_at = NULL, last_error = ${message}, updated_at = now()
        WHERE id = ${event.id}::uuid AND status = 'processing' AND lease_token = ${event.leaseToken}::uuid
      `)
    },
  }
}
