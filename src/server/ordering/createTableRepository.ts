import type { RestaurantTableRepository } from "@/business/order/createTable"
import type { PrismaClient } from "@/generated/prisma/client"

export function createRestaurantTableRepository(prisma: PrismaClient): RestaurantTableRepository {
  return {
    async createTable({ tableId, restaurantSlug, userId, label, qrTokenHash }) {
      const membership = await prisma.restaurantMembership.findFirst({
        where: {
          userId,
          status: "active",
          role: { in: ["owner", "manager"] },
          restaurant: { is: { slug: restaurantSlug, isActive: true } },
        },
        select: { tenantId: true, restaurantId: true },
      })

      if (!membership) return null

      const table = await prisma.restaurantTable.create({
        data: {
          id: tableId,
          tenantId: membership.tenantId,
          restaurantId: membership.restaurantId,
          label,
          qrTokenHash,
        },
        select: { id: true, label: true },
      })

      return table
    },
  }
}
