import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { expect, test } from "bun:test"

const repositoryRoot = fileURLToPath(new URL("../..", import.meta.url))
const prismaSchema = readFileSync(`${repositoryRoot}/prisma/schema.prisma`, "utf8")
const orderingRls = readFileSync(
  `${repositoryRoot}/supabase/migrations/20261018170000_ordering_rls.sql`,
  "utf8",
)
const relationalSchema = readFileSync(
  `${repositoryRoot}/supabase/migrations/20261018140000_relational_schema.sql`,
  "utf8",
)
const supabaseBaseline = readFileSync(
  `${repositoryRoot}/supabase/migrations/00000000000000_prisma_baseline.sql`,
  "utf8",
)

test("ordering schema includes tenant-scoped aggregates and immutable snapshots", () => {
  for (const model of [
    "RestaurantTable",
    "TableSession",
    "MenuCategory",
    "MenuItem",
    "ModifierGroup",
    "Modifier",
    "Order",
    "OrderItem",
    "OrderItemModifier",
    "OrderStateTransition",
  ]) {
    expect(prismaSchema).toContain(`model ${model}`)
  }

  for (const field of ["tenantId", "restaurantId", "orderId", "priceCents"]) {
    expect(prismaSchema).toContain(field)
  }

  expect(prismaSchema).toContain("enum OrderStatus")
  expect(prismaSchema).toContain("@@unique([tenantId, tokenHash]")
})

test("ordering RLS migration protects every new table and scopes staff access", () => {
  for (const table of [
    "restaurant_tables",
    "table_sessions",
    "menu_categories",
    "menu_items",
    "modifier_groups",
    "modifiers",
    "orders",
    "order_items",
    "order_item_modifiers",
    "order_state_transitions",
  ]) {
    expect(orderingRls).toContain(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY`)
  }

  expect(orderingRls).toContain("CREATE POLICY orders_select_staff")
  expect(orderingRls).toContain("CREATE POLICY orders_select_table_session")
  expect(orderingRls).toContain("has_restaurant_membership")
  expect(orderingRls).toContain("SECURITY DEFINER")
  expect(orderingRls).toContain("SET search_path = public")
  expect(orderingRls).not.toContain("CREATE POLICY menu_categories_select_public")
  expect(orderingRls).not.toContain(
    "GRANT SELECT ON\n  public.menu_categories,\n  public.menu_items,\n  public.modifier_groups,\n  public.modifiers,\n  public.menu_item_modifier_groups\nTO anon;",
  )
})

test("Supabase owns the complete relational migration and Prisma remains ORM-only", () => {
  for (const table of ["tenants", "restaurants", "restaurant_tables", "orders", "order_items"]) {
    expect(relationalSchema).toContain(`CREATE TABLE IF NOT EXISTS "${table}"`)
  }
  expect(relationalSchema).toContain("Supabase owns the complete relational schema")
  expect(relationalSchema).toContain("CREATE UNIQUE INDEX IF NOT EXISTS")
  expect(supabaseBaseline).not.toContain("Prisma creates")
})
