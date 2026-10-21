import type { KitchenOrdersRepository } from "@/business/order/kitchenOrders"
import type { OrderStatus } from "@/business/order/orderState"
import type { PrismaClient } from "@/generated/prisma/client"

export function createKitchenOrdersRepository(prisma: PrismaClient): KitchenOrdersRepository {
  return {
    async findOrders({ restaurantSlug, userId, statuses }) {
      const membership = await prisma.restaurantMembership.findFirst({
        where: {
          userId,
          status: "active",
          restaurant: { is: { slug: restaurantSlug, isActive: true } },
          role: { in: ["owner", "manager", "kitchen", "waiter"] },
        },
        select: { tenantId: true, restaurantId: true },
      })

      if (!membership) {
        return null
      }

      const orders = await prisma.order.findMany({
        where: {
          tenantId: membership.tenantId,
          restaurantId: membership.restaurantId,
          status: { in: statuses as never[] },
        },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        select: {
          id: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          table: { select: { label: true } },
          items: {
            orderBy: { createdAt: "asc" },
            select: { nameSnapshot: true, quantity: true, note: true },
          },
        },
      })

      return {
        restaurantId: membership.restaurantId,
        orders: orders.map((order) => ({
        id: order.id,
        status: order.status as OrderStatus,
        tableLabel: order.table.label,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        items: order.items.map((item) => ({
          name: item.nameSnapshot,
          quantity: item.quantity,
          note: item.note,
        })),
        })),
      }
    },
  }
}
