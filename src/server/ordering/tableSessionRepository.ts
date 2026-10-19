import type { PrismaClient } from "@/generated/prisma/client"
import type { TableSessionRepository } from "@/business/order/tableSession"

export function createTableSessionRepository(prisma: PrismaClient): TableSessionRepository {
  return {
    async findActiveTable({ tableId, qrTokenHash }) {
      const table = await prisma.restaurantTable.findFirst({
        where: {
          id: tableId,
          qrTokenHash,
          isActive: true,
          restaurant: { is: { isActive: true } },
        },
        select: {
          id: true,
          tenantId: true,
          restaurantId: true,
          label: true,
          restaurant: { select: { slug: true } },
        },
      })

      if (!table?.restaurant.slug) {
        return null
      }

      return {
        id: table.id,
        tenantId: table.tenantId,
        restaurantId: table.restaurantId,
        label: table.label,
        restaurantSlug: table.restaurant.slug,
      }
    },

    async createSession({ tenantId, restaurantId, tableId, tokenHash, expiresAt }) {
      const session = await prisma.tableSession.create({
        data: {
          tenantId,
          restaurantId,
          tableId,
          tokenHash,
          expiresAt,
          status: "active",
        },
        select: {
          id: true,
          tenantId: true,
          restaurantId: true,
          tableId: true,
          tokenHash: true,
          table: { select: { label: true } },
          restaurant: { select: { slug: true } },
        },
      })

      if (!session.restaurant.slug) {
        throw new Error("Restaurant slug is required for a public table session")
      }

      return {
        id: session.id,
        tenantId: session.tenantId,
        restaurantId: session.restaurantId,
        tableId: session.tableId,
        tableLabel: session.table.label,
        restaurantSlug: session.restaurant.slug,
        sessionTokenHash: session.tokenHash,
      }
    },
  }
}
