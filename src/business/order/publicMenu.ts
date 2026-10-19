export type PublicMenuModifier = {
  id: string
  name: string
  priceDeltaCents: number
}

export type PublicMenuModifierGroup = {
  id: string
  name: string
  minSelections: number
  maxSelections: number
  modifiers: PublicMenuModifier[]
}

export type PublicMenuItem = {
  id: string
  name: string
  description: string | null
  priceCents: number
  currency: string
  sortOrder: number
  modifierGroups: PublicMenuModifierGroup[]
}

export type PublicMenuCategory = {
  id: string
  name: string
  sortOrder: number
  items: PublicMenuItem[]
}

export type PublicMenu = {
  restaurantId: string
  restaurantSlug: string
  categories: PublicMenuCategory[]
}

export type PublicMenuRepository = {
  findPublishedMenu(input: {
    restaurantSlug: string
    sessionId: string
    sessionTokenHash: string
    now: Date
  }): Promise<PublicMenu | null>
}

export class PublicMenuError extends Error {
  constructor(public readonly code: "MENU_NOT_AVAILABLE" | "MENU_SESSION_REQUIRED") {
    super(code)
  }
}

export async function getPublicMenu(input: {
  repository: PublicMenuRepository
  restaurantSlug: string
  sessionId: string
  sessionToken: string
  now?: Date
}) {
  if (!input.sessionId || !input.sessionToken) {
    throw new PublicMenuError("MENU_SESSION_REQUIRED")
  }

  const menu = await input.repository.findPublishedMenu({
    restaurantSlug: input.restaurantSlug,
    sessionId: input.sessionId,
    sessionTokenHash: hashSessionToken(input.sessionToken),
    now: input.now ?? new Date(),
  })

  if (!menu) {
    throw new PublicMenuError("MENU_NOT_AVAILABLE")
  }

  return menu
}
import { hashSessionToken } from "@/business/order/tableToken"
