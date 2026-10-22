import { afterAll, beforeAll, describe, expect, mock, test } from "bun:test"
import type pg from "pg"

import { listKitchenOrders } from "@/business/order/kitchenOrders"
import { createKitchenOrdersRepository } from "@/server/ordering/kitchenOrdersRepository"

import { createFixture, createTestPool, createTestPrisma, databaseUrl } from "../integration/support/database"

// Regression for the X-Restaurant-Id leak fixed in 8374dce: the header was resolved by slug alone,
// and slugs are unique only per tenant. Only the Supabase Auth boundary is replaced; the route and
// the Prisma queries run against the local database.
let signedInUserId = ""
mock.module("@/utils/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: { id: signedInUserId } }, error: null }) },
  }),
  verifySessionServer: async () => ({ id: signedInUserId }),
}))

const sharedSlug = `shared-${crypto.randomUUID().slice(0, 8)}`
let pool: pg.Pool
let prismaForUseCase: ReturnType<typeof createTestPrisma>
let routeGet: (request: Request, context: { params: Promise<{ slug: string }> }) => Promise<Response>
let otherTenant: Awaited<ReturnType<typeof createFixture>>
let member: Awaited<ReturnType<typeof createFixture>>

beforeAll(async () => {
  process.env.DATABASE_URL = databaseUrl
  pool = await createTestPool()
  prismaForUseCase = createTestPrisma()
  const route = await import("@/app/api/restaurants/[slug]/orders/route")
  routeGet = route.GET

  // The other tenant is created first, so a slug-only lookup would find its restaurant.
  otherTenant = await createFixture(pool, { role: "kitchen", slug: sharedSlug })
  member = await createFixture(pool, { role: "kitchen", slug: sharedSlug })
})

afterAll(async () => {
  const { getPrismaClient } = await import("@/server/infra/prisma/client")
  await getPrismaClient().$disconnect()
  await prismaForUseCase.$disconnect()
  await pool.end()
})

function kitchenRequest(slug: string) {
  return routeGet(new Request(`http://localhost/api/restaurants/${slug}/orders`), {
    params: Promise.resolve({ slug }),
  })
}

describe("kitchen orders X-Restaurant-Id", () => {
  test("returns the restaurant of the signed-in member when another tenant uses the same slug", async () => {
    signedInUserId = member.userId

    const response = await kitchenRequest(sharedSlug)

    expect(response.status).toBe(200)
    expect(response.headers.get("X-Restaurant-Id")).toBe(member.restaurantId)
    expect(response.headers.get("X-Restaurant-Id")).not.toBe(otherTenant.restaurantId)
  })

  test("the other tenant's member gets its own restaurant, never the first slug match", async () => {
    signedInUserId = otherTenant.userId

    const response = await kitchenRequest(sharedSlug)

    expect(response.status).toBe(200)
    expect(response.headers.get("X-Restaurant-Id")).toBe(otherTenant.restaurantId)
  })

  test("the use case resolves the restaurant from the membership, not from the slug", async () => {
    const result = await listKitchenOrders({
      repository: createKitchenOrdersRepository(prismaForUseCase),
      restaurantSlug: sharedSlug,
      userId: member.userId,
      statuses: ["pending", "confirmed", "preparing", "ready"],
    })

    expect(result.restaurantId).toBe(member.restaurantId)
  })
})
