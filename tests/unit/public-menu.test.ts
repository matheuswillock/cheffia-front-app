import { expect, test } from "bun:test"

import { getPublicMenu, type PublicMenuRepository } from "@/business/order/publicMenu"

const repository: PublicMenuRepository = {
  async findPublishedMenu(input) {
    expect(input).toEqual({
      restaurantSlug: "demo",
      sessionId: "00000000-0000-0000-0000-000000000003",
      sessionTokenHash: expect.any(String),
      now: expect.any(Date),
    })
    return {
      restaurantId: "restaurant-1",
      restaurantSlug: "demo",
      categories: [
        {
          id: "category-1",
          name: "Pratos",
          sortOrder: 1,
          items: [
            {
              id: "item-1",
              name: "Prato do dia",
              description: null,
              priceCents: 2500,
              currency: "BRL",
              sortOrder: 1,
              modifierGroups: [],
            },
          ],
        },
      ],
    }
  },
}

test("returns only the server-owned published menu shape", async () => {
  const menu = await getPublicMenu({
    repository,
    restaurantSlug: "demo",
    sessionId: "00000000-0000-0000-0000-000000000003",
    sessionToken: "session-token-12345678",
  })

  expect(menu).toEqual({
    restaurantId: "restaurant-1",
    restaurantSlug: "demo",
    categories: [
      {
        id: "category-1",
        name: "Pratos",
        sortOrder: 1,
        items: [
          {
            id: "item-1",
            name: "Prato do dia",
            description: null,
            priceCents: 2500,
            currency: "BRL",
            sortOrder: 1,
            modifierGroups: [],
          },
        ],
      },
    ],
  })
})

test("rejects an unavailable restaurant without leaking whether it exists", async () => {
  const unavailableRepository: PublicMenuRepository = {
    async findPublishedMenu() {
      return null
    },
  }

  await expect(
    getPublicMenu({
      repository: unavailableRepository,
      restaurantSlug: "missing",
      sessionId: "00000000-0000-0000-0000-000000000003",
      sessionToken: "session-token-12345678",
    }),
  ).rejects.toMatchObject({ code: "MENU_NOT_AVAILABLE" })
})

test("requires a table session before querying the menu", async () => {
  await expect(
    getPublicMenu({
      repository,
      restaurantSlug: "demo",
      sessionId: "",
      sessionToken: "",
    }),
  ).rejects.toMatchObject({ code: "MENU_SESSION_REQUIRED" })
})
