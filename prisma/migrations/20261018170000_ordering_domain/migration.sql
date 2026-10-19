-- CreateEnum
CREATE TYPE "table_session_status" AS ENUM ('active', 'expired', 'revoked');

-- CreateEnum
CREATE TYPE "order_status" AS ENUM ('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'rejected', 'cancelled');

-- CreateTable
CREATE TABLE "restaurant_tables" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "restaurant_id" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "qr_token_hash" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "restaurant_tables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "table_sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "restaurant_id" UUID NOT NULL,
    "table_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "status" "table_session_status" NOT NULL DEFAULT 'active',
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "last_seen_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "table_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_categories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "restaurant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "menu_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "restaurant_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price_cents" INTEGER NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'BRL',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "menu_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modifier_groups" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "restaurant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "min_selections" INTEGER NOT NULL DEFAULT 0,
    "max_selections" INTEGER NOT NULL DEFAULT 1,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "modifier_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modifiers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "restaurant_id" UUID NOT NULL,
    "group_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "price_delta_cents" INTEGER NOT NULL DEFAULT 0,
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "modifiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_item_modifier_groups" (
    "tenant_id" UUID NOT NULL,
    "restaurant_id" UUID NOT NULL,
    "menu_item_id" UUID NOT NULL,
    "modifier_group_id" UUID NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "menu_item_modifier_groups_pkey" PRIMARY KEY ("tenant_id","menu_item_id","modifier_group_id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "restaurant_id" UUID NOT NULL,
    "table_id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "status" "order_status" NOT NULL DEFAULT 'pending',
    "note" TEXT,
    "subtotal_cents" INTEGER NOT NULL,
    "total_cents" INTEGER NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'BRL',
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "restaurant_id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "source_menu_item_id" UUID,
    "name_snapshot" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price_cents" INTEGER NOT NULL,
    "line_total_cents" INTEGER NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_item_modifiers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "restaurant_id" UUID NOT NULL,
    "order_item_id" UUID NOT NULL,
    "source_modifier_id" UUID,
    "name_snapshot" TEXT NOT NULL,
    "price_delta_cents" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_item_modifiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_state_transitions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "restaurant_id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "from_status" "order_status",
    "to_status" "order_status" NOT NULL,
    "actor_user_id" UUID,
    "actor_role" TEXT NOT NULL,
    "reason" TEXT,
    "request_id" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_state_transitions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "restaurant_tables_tenant_restaurant_active_idx" ON "restaurant_tables"("tenant_id", "restaurant_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "restaurant_tables_tenant_id_uk" ON "restaurant_tables"("tenant_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "restaurant_tables_tenant_restaurant_id_uk" ON "restaurant_tables"("tenant_id", "restaurant_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "restaurant_tables_tenant_restaurant_label_uk" ON "restaurant_tables"("tenant_id", "restaurant_id", "label");

-- CreateIndex
CREATE UNIQUE INDEX "restaurant_tables_tenant_qr_token_hash_uk" ON "restaurant_tables"("tenant_id", "qr_token_hash");

-- CreateIndex
CREATE INDEX "table_sessions_tenant_table_status_idx" ON "table_sessions"("tenant_id", "table_id", "status");

-- CreateIndex
CREATE INDEX "table_sessions_tenant_expires_at_idx" ON "table_sessions"("tenant_id", "expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "table_sessions_tenant_id_uk" ON "table_sessions"("tenant_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "table_sessions_tenant_restaurant_id_uk" ON "table_sessions"("tenant_id", "restaurant_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "table_sessions_tenant_token_hash_uk" ON "table_sessions"("tenant_id", "token_hash");

-- CreateIndex
CREATE INDEX "menu_categories_publication_idx" ON "menu_categories"("tenant_id", "restaurant_id", "is_published", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "menu_categories_tenant_id_uk" ON "menu_categories"("tenant_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "menu_categories_tenant_restaurant_id_uk" ON "menu_categories"("tenant_id", "restaurant_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "menu_categories_tenant_restaurant_name_uk" ON "menu_categories"("tenant_id", "restaurant_id", "name");

-- CreateIndex
CREATE INDEX "menu_items_publication_idx" ON "menu_items"("tenant_id", "restaurant_id", "is_published", "is_available", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "menu_items_tenant_id_uk" ON "menu_items"("tenant_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "menu_items_tenant_restaurant_id_uk" ON "menu_items"("tenant_id", "restaurant_id", "id");

-- CreateIndex
CREATE INDEX "modifier_groups_restaurant_active_idx" ON "modifier_groups"("tenant_id", "restaurant_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "modifier_groups_tenant_id_uk" ON "modifier_groups"("tenant_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "modifier_groups_tenant_restaurant_id_uk" ON "modifier_groups"("tenant_id", "restaurant_id", "id");

-- CreateIndex
CREATE INDEX "modifiers_group_available_idx" ON "modifiers"("tenant_id", "group_id", "is_available");

-- CreateIndex
CREATE UNIQUE INDEX "modifiers_tenant_id_uk" ON "modifiers"("tenant_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "modifiers_tenant_restaurant_id_uk" ON "modifiers"("tenant_id", "restaurant_id", "id");

-- CreateIndex
CREATE INDEX "menu_item_modifier_groups_order_idx" ON "menu_item_modifier_groups"("tenant_id", "restaurant_id", "sort_order");

-- CreateIndex
CREATE INDEX "orders_kitchen_queue_idx" ON "orders"("tenant_id", "restaurant_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "orders_session_created_idx" ON "orders"("tenant_id", "session_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "orders_tenant_id_uk" ON "orders"("tenant_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "orders_tenant_restaurant_id_uk" ON "orders"("tenant_id", "restaurant_id", "id");

-- CreateIndex
CREATE INDEX "order_items_order_idx" ON "order_items"("tenant_id", "order_id");

-- CreateIndex
CREATE UNIQUE INDEX "order_items_tenant_id_uk" ON "order_items"("tenant_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "order_items_tenant_restaurant_id_uk" ON "order_items"("tenant_id", "restaurant_id", "id");

-- CreateIndex
CREATE INDEX "order_item_modifiers_item_idx" ON "order_item_modifiers"("tenant_id", "order_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "order_item_modifiers_tenant_id_uk" ON "order_item_modifiers"("tenant_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "order_item_modifiers_tenant_restaurant_id_uk" ON "order_item_modifiers"("tenant_id", "restaurant_id", "id");

-- CreateIndex
CREATE INDEX "order_state_transitions_order_idx" ON "order_state_transitions"("tenant_id", "order_id", "created_at");

-- CreateIndex
CREATE INDEX "order_state_transitions_restaurant_idx" ON "order_state_transitions"("tenant_id", "restaurant_id", "created_at");

-- AddForeignKey
ALTER TABLE "restaurant_tables" ADD CONSTRAINT "restaurant_tables_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "restaurant_tables" ADD CONSTRAINT "restaurant_tables_tenant_id_restaurant_id_fkey" FOREIGN KEY ("tenant_id", "restaurant_id") REFERENCES "restaurants"("tenant_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "table_sessions" ADD CONSTRAINT "table_sessions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "table_sessions" ADD CONSTRAINT "table_sessions_tenant_id_restaurant_id_fkey" FOREIGN KEY ("tenant_id", "restaurant_id") REFERENCES "restaurants"("tenant_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "table_sessions" ADD CONSTRAINT "table_sessions_tenant_id_restaurant_id_table_id_fkey" FOREIGN KEY ("tenant_id", "restaurant_id", "table_id") REFERENCES "restaurant_tables"("tenant_id", "restaurant_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_categories" ADD CONSTRAINT "menu_categories_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_categories" ADD CONSTRAINT "menu_categories_tenant_id_restaurant_id_fkey" FOREIGN KEY ("tenant_id", "restaurant_id") REFERENCES "restaurants"("tenant_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_tenant_id_restaurant_id_fkey" FOREIGN KEY ("tenant_id", "restaurant_id") REFERENCES "restaurants"("tenant_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_tenant_id_restaurant_id_category_id_fkey" FOREIGN KEY ("tenant_id", "restaurant_id", "category_id") REFERENCES "menu_categories"("tenant_id", "restaurant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modifier_groups" ADD CONSTRAINT "modifier_groups_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modifier_groups" ADD CONSTRAINT "modifier_groups_tenant_id_restaurant_id_fkey" FOREIGN KEY ("tenant_id", "restaurant_id") REFERENCES "restaurants"("tenant_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modifiers" ADD CONSTRAINT "modifiers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modifiers" ADD CONSTRAINT "modifiers_tenant_id_restaurant_id_fkey" FOREIGN KEY ("tenant_id", "restaurant_id") REFERENCES "restaurants"("tenant_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modifiers" ADD CONSTRAINT "modifiers_tenant_id_restaurant_id_group_id_fkey" FOREIGN KEY ("tenant_id", "restaurant_id", "group_id") REFERENCES "modifier_groups"("tenant_id", "restaurant_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_item_modifier_groups" ADD CONSTRAINT "menu_item_modifier_groups_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_item_modifier_groups" ADD CONSTRAINT "menu_item_modifier_groups_tenant_id_restaurant_id_fkey" FOREIGN KEY ("tenant_id", "restaurant_id") REFERENCES "restaurants"("tenant_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_item_modifier_groups" ADD CONSTRAINT "menu_item_modifier_groups_tenant_id_restaurant_id_menu_ite_fkey" FOREIGN KEY ("tenant_id", "restaurant_id", "menu_item_id") REFERENCES "menu_items"("tenant_id", "restaurant_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_item_modifier_groups" ADD CONSTRAINT "menu_item_modifier_groups_tenant_id_restaurant_id_modifier_fkey" FOREIGN KEY ("tenant_id", "restaurant_id", "modifier_group_id") REFERENCES "modifier_groups"("tenant_id", "restaurant_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_tenant_id_restaurant_id_fkey" FOREIGN KEY ("tenant_id", "restaurant_id") REFERENCES "restaurants"("tenant_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_tenant_id_restaurant_id_table_id_fkey" FOREIGN KEY ("tenant_id", "restaurant_id", "table_id") REFERENCES "restaurant_tables"("tenant_id", "restaurant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_tenant_id_restaurant_id_session_id_fkey" FOREIGN KEY ("tenant_id", "restaurant_id", "session_id") REFERENCES "table_sessions"("tenant_id", "restaurant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_tenant_id_restaurant_id_fkey" FOREIGN KEY ("tenant_id", "restaurant_id") REFERENCES "restaurants"("tenant_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_tenant_id_restaurant_id_order_id_fkey" FOREIGN KEY ("tenant_id", "restaurant_id", "order_id") REFERENCES "orders"("tenant_id", "restaurant_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_item_modifiers" ADD CONSTRAINT "order_item_modifiers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_item_modifiers" ADD CONSTRAINT "order_item_modifiers_tenant_id_restaurant_id_fkey" FOREIGN KEY ("tenant_id", "restaurant_id") REFERENCES "restaurants"("tenant_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_item_modifiers" ADD CONSTRAINT "order_item_modifiers_tenant_id_restaurant_id_order_item_id_fkey" FOREIGN KEY ("tenant_id", "restaurant_id", "order_item_id") REFERENCES "order_items"("tenant_id", "restaurant_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_state_transitions" ADD CONSTRAINT "order_state_transitions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_state_transitions" ADD CONSTRAINT "order_state_transitions_tenant_id_restaurant_id_fkey" FOREIGN KEY ("tenant_id", "restaurant_id") REFERENCES "restaurants"("tenant_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_state_transitions" ADD CONSTRAINT "order_state_transitions_tenant_id_restaurant_id_order_id_fkey" FOREIGN KEY ("tenant_id", "restaurant_id", "order_id") REFERENCES "orders"("tenant_id", "restaurant_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Domain invariants that are intentionally database-enforced as well as validated in the use cases.
ALTER TABLE "menu_items"
  ADD CONSTRAINT "menu_items_price_cents_nonnegative_ck" CHECK ("price_cents" >= 0);

ALTER TABLE "modifier_groups"
  ADD CONSTRAINT "modifier_groups_selection_bounds_ck"
  CHECK ("min_selections" >= 0 AND "max_selections" >= "min_selections");

ALTER TABLE "orders"
  ADD CONSTRAINT "orders_totals_nonnegative_ck"
  CHECK ("subtotal_cents" >= 0 AND "total_cents" >= 0);

ALTER TABLE "order_items"
  ADD CONSTRAINT "order_items_values_valid_ck"
  CHECK ("quantity" > 0 AND "unit_price_cents" >= 0 AND "line_total_cents" >= 0);
