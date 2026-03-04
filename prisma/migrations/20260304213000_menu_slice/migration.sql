-- Task 10: Menu + MenuLive vertical slice (multi-tenant)

CREATE TABLE IF NOT EXISTS "public"."menus" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "restaurant_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    CONSTRAINT "menus_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "menus_tenant_id_fkey"
        FOREIGN KEY ("tenant_id")
        REFERENCES "public"."tenants"("id")
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT "menus_restaurant_id_fkey"
        FOREIGN KEY ("restaurant_id")
        REFERENCES "public"."restaurants"("id")
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "public"."menu_categories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "menu_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    CONSTRAINT "menu_categories_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "menu_categories_tenant_id_fkey"
        FOREIGN KEY ("tenant_id")
        REFERENCES "public"."tenants"("id")
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT "menu_categories_menu_id_fkey"
        FOREIGN KEY ("menu_id")
        REFERENCES "public"."menus"("id")
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "public"."menu_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "menu_id" UUID NOT NULL,
    "category_id" UUID,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "ingredients" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "price" DECIMAL(10,2) NOT NULL,
    "media_id" TEXT,
    "media_url" TEXT,
    "media_imgix_url" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    CONSTRAINT "menu_items_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "menu_items_tenant_id_fkey"
        FOREIGN KEY ("tenant_id")
        REFERENCES "public"."tenants"("id")
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT "menu_items_menu_id_fkey"
        FOREIGN KEY ("menu_id")
        REFERENCES "public"."menus"("id")
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT "menu_items_category_id_fkey"
        FOREIGN KEY ("category_id")
        REFERENCES "public"."menu_categories"("id")
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "menus_restaurant_id_uk"
    ON "public"."menus"("restaurant_id");
CREATE UNIQUE INDEX IF NOT EXISTS "menus_tenant_restaurant_uk"
    ON "public"."menus"("tenant_id", "restaurant_id");
CREATE UNIQUE INDEX IF NOT EXISTS "menus_tenant_id_uk"
    ON "public"."menus"("tenant_id", "id");
CREATE INDEX IF NOT EXISTS "menus_tenant_id_idx"
    ON "public"."menus"("tenant_id");

CREATE UNIQUE INDEX IF NOT EXISTS "menu_categories_tenant_menu_name_uk"
    ON "public"."menu_categories"("tenant_id", "menu_id", "name");
CREATE UNIQUE INDEX IF NOT EXISTS "menu_categories_tenant_id_uk"
    ON "public"."menu_categories"("tenant_id", "id");
CREATE INDEX IF NOT EXISTS "menu_categories_tenant_id_idx"
    ON "public"."menu_categories"("tenant_id");
CREATE INDEX IF NOT EXISTS "menu_categories_tenant_menu_idx"
    ON "public"."menu_categories"("tenant_id", "menu_id");

CREATE UNIQUE INDEX IF NOT EXISTS "menu_items_tenant_id_uk"
    ON "public"."menu_items"("tenant_id", "id");
CREATE INDEX IF NOT EXISTS "menu_items_tenant_id_idx"
    ON "public"."menu_items"("tenant_id");
CREATE INDEX IF NOT EXISTS "menu_items_tenant_menu_idx"
    ON "public"."menu_items"("tenant_id", "menu_id");
CREATE INDEX IF NOT EXISTS "menu_items_tenant_category_idx"
    ON "public"."menu_items"("tenant_id", "category_id");

DROP TRIGGER IF EXISTS "trg_menus_set_updated_at" ON "public"."menus";
CREATE TRIGGER "trg_menus_set_updated_at"
BEFORE UPDATE ON "public"."menus"
FOR EACH ROW
EXECUTE FUNCTION "public"."set_updated_at"();

DROP TRIGGER IF EXISTS "trg_menu_categories_set_updated_at" ON "public"."menu_categories";
CREATE TRIGGER "trg_menu_categories_set_updated_at"
BEFORE UPDATE ON "public"."menu_categories"
FOR EACH ROW
EXECUTE FUNCTION "public"."set_updated_at"();

DROP TRIGGER IF EXISTS "trg_menu_items_set_updated_at" ON "public"."menu_items";
CREATE TRIGGER "trg_menu_items_set_updated_at"
BEFORE UPDATE ON "public"."menu_items"
FOR EACH ROW
EXECUTE FUNCTION "public"."set_updated_at"();
