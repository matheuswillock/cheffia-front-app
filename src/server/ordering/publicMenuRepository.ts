import type { PublicMenuRepository } from "@/business/order/publicMenu"
import type { PrismaClient } from "@/generated/prisma/client"

export function createPublicMenuRepository(prisma: PrismaClient): PublicMenuRepository {
  return {
    async findPublishedMenu({ restaurantSlug, sessionId, sessionTokenHash, now }) {
      const restaurant = await prisma.restaurant.findFirst({
        where: {
          slug: restaurantSlug,
          isActive: true,
          tableSessions: {
            some: {
              id: sessionId,
              tokenHash: sessionTokenHash,
              status: "active",
              expiresAt: { gt: now },
            },
          },
        },
        select: {
          id: true,
          slug: true,
          menuCategories: {
            where: { isPublished: true },
            orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
            select: {
              id: true,
              name: true,
              sortOrder: true,
              items: {
                where: { isPublished: true, isAvailable: true },
                orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
                select: {
                  id: true,
                  name: true,
                  description: true,
                  priceCents: true,
                  currency: true,
                  sortOrder: true,
                  modifierGroups: {
                    where: { modifierGroup: { is: { isActive: true } } },
                    orderBy: { sortOrder: "asc" },
                    select: {
                      modifierGroup: {
                        select: {
                          id: true,
                          name: true,
                          minSelections: true,
                          maxSelections: true,
                          modifiers: {
                            where: { isAvailable: true },
                            orderBy: { name: "asc" },
                            select: {
                              id: true,
                              name: true,
                              priceDeltaCents: true,
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      })

      if (!restaurant?.slug) {
        return null
      }

      return {
        restaurantId: restaurant.id,
        restaurantSlug: restaurant.slug,
        categories: restaurant.menuCategories.map((category) => ({
          id: category.id,
          name: category.name,
          sortOrder: category.sortOrder,
          items: category.items.map((item) => ({
            id: item.id,
            name: item.name,
            description: item.description,
            priceCents: item.priceCents,
            currency: item.currency,
            sortOrder: item.sortOrder,
            modifierGroups: item.modifierGroups.map(({ modifierGroup }) => ({
              id: modifierGroup.id,
              name: modifierGroup.name,
              minSelections: modifierGroup.minSelections,
              maxSelections: modifierGroup.maxSelections,
              modifiers: modifierGroup.modifiers,
            })),
          })),
        })),
      }
    },
  }
}
