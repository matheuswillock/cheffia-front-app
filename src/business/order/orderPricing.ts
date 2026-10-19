import type { CreateOrderRequest } from "@/business/order/orderContracts"

export type CatalogModifier = {
  id: string
  name: string
  priceDeltaCents: number
  isAvailable?: boolean
}

export type CatalogModifierGroup = {
  id: string
  name: string
  minSelections: number
  maxSelections: number
  modifiers: CatalogModifier[]
}

export type CatalogMenuItem = {
  id: string
  name: string
  priceCents: number
  currency: string
  modifierGroups: CatalogModifierGroup[]
}

export type OrderItemSnapshot = {
  sourceMenuItemId: string
  nameSnapshot: string
  quantity: number
  unitPriceCents: number
  lineTotalCents: number
  note: string | null
  modifiers: Array<{
    sourceModifierId: string
    nameSnapshot: string
    priceDeltaCents: number
  }>
}

export class OrderPricingError extends Error {
  constructor(
    public readonly code:
      | "MENU_ITEM_UNAVAILABLE"
      | "INVALID_MODIFIER_SELECTION"
      | "ORDER_CURRENCY_CONFLICT",
  ) {
    super(code)
  }
}

export function priceOrderItems(
  requestedItems: CreateOrderRequest["items"],
  catalog: CatalogMenuItem[],
) {
  const catalogById = new Map(catalog.map((item) => [item.id, item]))
  let currency: string | null = null
  let subtotalCents = 0

  const items: OrderItemSnapshot[] = requestedItems.map((requestedItem) => {
    const menuItem = catalogById.get(requestedItem.menuItemId)
    if (!menuItem) {
      throw new OrderPricingError("MENU_ITEM_UNAVAILABLE")
    }

    if (currency && currency !== menuItem.currency) {
      throw new OrderPricingError("ORDER_CURRENCY_CONFLICT")
    }
    currency = menuItem.currency

    const selectedIds = requestedItem.modifierIds
    if (new Set(selectedIds).size !== selectedIds.length) {
      throw new OrderPricingError("INVALID_MODIFIER_SELECTION")
    }

    const modifiersById = new Map(
      menuItem.modifierGroups.flatMap((group) =>
        group.modifiers.map((modifier) => [modifier.id, modifier] as const),
      ),
    )
    const selectedModifiers = selectedIds.map((modifierId) => {
      const modifier = modifiersById.get(modifierId)
      if (!modifier || modifier.isAvailable === false) {
        throw new OrderPricingError("INVALID_MODIFIER_SELECTION")
      }
      return modifier
    })

    for (const group of menuItem.modifierGroups) {
      const groupModifierIds = new Set(group.modifiers.map((modifier) => modifier.id))
      const selectedCount = selectedIds.filter((modifierId) => groupModifierIds.has(modifierId)).length
      if (selectedCount < group.minSelections || selectedCount > group.maxSelections) {
        throw new OrderPricingError("INVALID_MODIFIER_SELECTION")
      }
    }

    const unitPriceCents =
      menuItem.priceCents + selectedModifiers.reduce((sum, modifier) => sum + modifier.priceDeltaCents, 0)
    if (unitPriceCents < 0) {
      throw new OrderPricingError("INVALID_MODIFIER_SELECTION")
    }

    const lineTotalCents = unitPriceCents * requestedItem.quantity
    subtotalCents += lineTotalCents

    return {
      sourceMenuItemId: menuItem.id,
      nameSnapshot: menuItem.name,
      quantity: requestedItem.quantity,
      unitPriceCents,
      lineTotalCents,
      note: requestedItem.note ?? null,
      modifiers: selectedModifiers.map((modifier) => ({
        sourceModifierId: modifier.id,
        nameSnapshot: modifier.name,
        priceDeltaCents: modifier.priceDeltaCents,
      })),
    }
  })

  return {
    currency: currency ?? "BRL",
    subtotalCents,
    totalCents: subtotalCents,
    items,
  }
}
