import { expect, test } from "bun:test"

import { priceOrderItems, type CatalogMenuItem } from "@/business/order/orderPricing"

const item: CatalogMenuItem = {
  id: "item-1",
  name: "Burger",
  priceCents: 2000,
  currency: "BRL",
  modifierGroups: [
    {
      id: "group-1",
      name: "Queijo",
      minSelections: 1,
      maxSelections: 1,
      modifiers: [{ id: "modifier-1", name: "Cheddar", priceDeltaCents: 300 }],
    },
  ],
}

test("prices from catalog values and creates immutable snapshots", () => {
  expect(
    priceOrderItems(
      [
        {
          menuItemId: "item-1",
          quantity: 2,
          modifierIds: ["modifier-1"],
          note: "Bem passado",
        },
      ],
      [item],
    ),
  ).toEqual({
    currency: "BRL",
    subtotalCents: 4600,
    totalCents: 4600,
    items: [
      {
        sourceMenuItemId: "item-1",
        nameSnapshot: "Burger",
        quantity: 2,
        unitPriceCents: 2300,
        lineTotalCents: 4600,
        note: "Bem passado",
        modifiers: [
          {
            sourceModifierId: "modifier-1",
            nameSnapshot: "Cheddar",
            priceDeltaCents: 300,
          },
        ],
      },
    ],
  })
})

test("rejects missing required modifiers and unknown catalog ids", () => {
  expect(() => priceOrderItems([{ menuItemId: "item-1", quantity: 1, modifierIds: [] }], [item])).toThrow(
    "INVALID_MODIFIER_SELECTION",
  )
  expect(() => priceOrderItems([{ menuItemId: "missing", quantity: 1, modifierIds: [] }], [item])).toThrow(
    "MENU_ITEM_UNAVAILABLE",
  )
})
