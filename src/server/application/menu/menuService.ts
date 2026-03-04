import { getSupabaseAdminClient } from "@/server/infra/supabase/adminClient";
import {
  SupabaseMenuMediaStorage,
  type MenuMediaStorage,
} from "@/server/infra/storage";
import { failOutput, okOutput, type Output } from "@/server/shared/output";
import type {
  AddMenuItemInput,
  GroupedMenuItemsByCategoryOutput,
  MenuLiveItemOutput,
  MenuLiveOutput,
  OutputCategory,
  OutputMenu,
  OutputMenuItem,
} from "./types";

const DEFAULT_CATEGORY_NAMES = [
  "Saladas",
  "Bebidas",
  "Sobremesas",
  "Pratos Principais",
  "Entradas",
  "Lanches",
  "Porções",
  "Acompanhamentos",
  "Massas",
  "Sopas",
  "Sanduíches",
  "Burgers",
  "Pizzas",
  "Bolos",
  "Doces",
];

interface RestaurantTenantRow {
  tenant_id: string;
  restaurant_menu_id: string | null;
}

interface MenuRow {
  id: string;
  tenant_id: string;
  restaurant_id: string;
}

interface MenuCategoryRow {
  id: string;
  tenant_id: string;
  menu_id: string;
  name: string;
}

interface MenuItemRow {
  id: string;
  tenant_id: string;
  menu_id: string;
  category_id: string | null;
  name: string;
  description: string;
  ingredients: string[] | null;
  price: string | number;
  media_id: string | null;
  media_url: string | null;
  media_imgix_url: string | null;
}

const toPrice = (value: string | number): number => {
  if (typeof value === "number") return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalizeIngredients = (ingredients: string[] | null): string[] => {
  if (!Array.isArray(ingredients)) return [];
  return ingredients
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
};

const mapMenuItem = (
  row: MenuItemRow,
  categoriesById: Map<string, OutputCategory>
): OutputMenuItem => ({
  id: row.id,
  name: row.name,
  description: row.description,
  ingredients: normalizeIngredients(row.ingredients),
  price: toPrice(row.price),
  mediaId: row.media_id,
  mediaUrl: row.media_url,
  mediaImgixUrl: row.media_imgix_url,
  menuId: row.menu_id,
  category: row.category_id ? categoriesById.get(row.category_id) ?? null : null,
});

export class MenuService {
  constructor(private readonly menuMediaStorage: MenuMediaStorage = new SupabaseMenuMediaStorage()) {}

  public async getTenantByRestaurantId(restaurantId: string): Promise<string | null> {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("restaurants")
      .select("tenant_id")
      .eq("id", restaurantId)
      .maybeSingle<{ tenant_id: string }>();

    if (error) {
      throw new Error(`Tenant lookup by restaurant id failed: ${error.message}`);
    }

    return data?.tenant_id ?? null;
  }

  public async getTenantByMenuItemId(itemId: string): Promise<string | null> {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("menu_items")
      .select("tenant_id")
      .eq("id", itemId)
      .maybeSingle<{ tenant_id: string }>();

    if (error) {
      throw new Error(`Tenant lookup by menu item id failed: ${error.message}`);
    }

    return data?.tenant_id ?? null;
  }

  public async getMenuByRestaurantId(
    tenantId: string,
    restaurantId: string
  ): Promise<Output<OutputMenu>> {
    try {
      const menu = await this.ensureMenuForRestaurant(tenantId, restaurantId);
      if (!menu) return failOutput("Restaurant's Menu not found");

      const output = await this.loadMenuOutput(menu);
      return okOutput(output, ["found menu"]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected error";
      return failOutput(`Error getting menu by restaurant id - ${message}`);
    }
  }

  public async addItem(
    tenantId: string,
    input: AddMenuItemInput
  ): Promise<Output<OutputMenu>> {
    try {
      const itemName = input.item.name.trim();
      if (!itemName) return failOutput("Item name is required");

      if (!Number.isFinite(input.item.price) || input.item.price < 0) {
        return failOutput("Invalid item price");
      }

      const menu = await this.ensureMenuForRestaurant(tenantId, input.restaurantId);
      if (!menu) return failOutput("Restaurant's Menu not found");

      let categoryId: string | null = null;
      if (input.item.categoryId) {
        const supabase = getSupabaseAdminClient();
        const { data: category, error: categoryError } = await supabase
          .from("menu_categories")
          .select("id")
          .eq("tenant_id", tenantId)
          .eq("menu_id", menu.id)
          .eq("id", input.item.categoryId)
          .maybeSingle<{ id: string }>();

        if (categoryError) {
          return failOutput(`Error validating category - ${categoryError.message}`);
        }

        categoryId = category?.id ?? null;
      }

      let mediaId: string | null = null;
      let mediaUrl: string | null = null;
      let mediaImgixUrl: string | null = null;

      if (input.item.itemMedia) {
        const uploaded = await this.menuMediaStorage.uploadMenuItemMedia({
          tenantId,
          menuId: menu.id,
          fileName: input.item.itemMedia.name,
          contentType: input.item.itemMedia.contentType,
          data: input.item.itemMedia.data,
        });
        mediaId = uploaded.path;
        mediaUrl = uploaded.publicUrl;
        mediaImgixUrl = uploaded.publicUrl;
      }

      const supabase = getSupabaseAdminClient();
      const { error: insertError } = await supabase.from("menu_items").insert({
        tenant_id: tenantId,
        menu_id: menu.id,
        category_id: categoryId,
        name: itemName,
        description: input.item.description.trim(),
        ingredients: input.item.ingredients,
        price: input.item.price,
        media_id: mediaId,
        media_url: mediaUrl,
        media_imgix_url: mediaImgixUrl,
      });

      if (insertError) {
        return failOutput(`Error adding item to menu - ${insertError.message}`);
      }

      const output = await this.loadMenuOutput(menu);
      return okOutput(output, ["Item added to menu"]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected error";
      return failOutput(`Error adding item to menu: ${message}`);
    }
  }

  public async deleteItem(tenantId: string, itemId: string): Promise<Output<null>> {
    try {
      const supabase = getSupabaseAdminClient();
      const { data: existingItem, error: findError } = await supabase
        .from("menu_items")
        .select("media_id")
        .eq("tenant_id", tenantId)
        .eq("id", itemId)
        .maybeSingle<{ media_id: string | null }>();

      if (findError) {
        return failOutput(`Error deleting item from menu: ${findError.message}`);
      }

      const { error } = await supabase
        .from("menu_items")
        .delete()
        .eq("tenant_id", tenantId)
        .eq("id", itemId);

      if (error) {
        return failOutput(`Error deleting item from menu: ${error.message}`);
      }

      const mediaPath = existingItem?.media_id?.trim() ?? "";
      if (mediaPath.startsWith("tenant/")) {
        try {
          await this.menuMediaStorage.removeMenuItemMedia(mediaPath);
        } catch (storageError) {
          const message =
            storageError instanceof Error ? storageError.message : "Unknown storage delete error";
          console.error("menu.delete.storage_remove_failed", {
            tenantId,
            itemId,
            mediaPath,
            message,
          });
        }
      }

      return okOutput<null>(null, ["Item deleted successfully"]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected error";
      return failOutput(`Error deleting item from menu: ${message}`);
    }
  }

  public async getMenuLiveByRestaurantId(
    tenantId: string,
    restaurantId: string
  ): Promise<Output<MenuLiveOutput>> {
    try {
      const menu = await this.ensureMenuForRestaurant(tenantId, restaurantId);
      if (!menu) return failOutput("Restaurant's Menu not found");

      const snapshot = await this.loadMenuOutput(menu);
      const groups = new Map<string, GroupedMenuItemsByCategoryOutput>();

      for (const item of snapshot.items) {
        const key = item.category?.id ?? "__uncategorized__";
        const existing = groups.get(key);
        const itemOutput: MenuLiveItemOutput = {
          id: item.id,
          name: item.name,
          description: item.description,
          ingredients: item.ingredients,
          price: item.price,
          mediaId: item.mediaId,
          mediaUrl: item.mediaUrl,
          mediaImgixUrl: item.mediaImgixUrl,
        };

        if (existing) {
          existing.menuItems.push(itemOutput);
          continue;
        }

        groups.set(key, {
          id: item.category?.id ?? null,
          name: item.category?.name ?? null,
          menuItems: [itemOutput],
        });
      }

      return okOutput(
        {
          id: snapshot.id,
          restaurantId: snapshot.restaurantId,
          menuByCategories: Array.from(groups.values()),
        },
        ["found menu"]
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected error";
      return failOutput(`MenuLiveUseCases::GetMenuByRestaurantIdAsync | Error getting menu by restaurant id - ${message}`);
    }
  }

  private async ensureMenuForRestaurant(
    tenantId: string,
    restaurantId: string
  ): Promise<MenuRow | null> {
    const supabase = getSupabaseAdminClient();
    const { data: restaurant, error: restaurantError } = await supabase
      .from("restaurants")
      .select("tenant_id, restaurant_menu_id")
      .eq("tenant_id", tenantId)
      .eq("id", restaurantId)
      .maybeSingle<RestaurantTenantRow>();

    if (restaurantError) {
      throw new Error(`Failed to lookup restaurant: ${restaurantError.message}`);
    }

    if (!restaurant) return null;

    const { data: existingMenu, error: menuError } = await supabase
      .from("menus")
      .select("id, tenant_id, restaurant_id")
      .eq("tenant_id", tenantId)
      .eq("restaurant_id", restaurantId)
      .maybeSingle<MenuRow>();

    if (menuError) {
      throw new Error(`Failed to lookup menu: ${menuError.message}`);
    }

    let menu = existingMenu;

    if (!menu) {
      const { data: insertedMenu, error: insertError } = await supabase
        .from("menus")
        .insert({
          tenant_id: tenantId,
          restaurant_id: restaurantId,
        })
        .select("id, tenant_id, restaurant_id")
        .single<MenuRow>();

      if (insertError) {
        if (insertError.code !== "23505") {
          throw new Error(`Failed to create menu: ${insertError.message}`);
        }

        const { data: raceWinner, error: raceError } = await supabase
          .from("menus")
          .select("id, tenant_id, restaurant_id")
          .eq("tenant_id", tenantId)
          .eq("restaurant_id", restaurantId)
          .single<MenuRow>();

        if (raceError) {
          throw new Error(`Failed to re-fetch menu after race: ${raceError.message}`);
        }

        menu = raceWinner;
      } else {
        menu = insertedMenu;
      }
    }

    await this.seedDefaultCategories(tenantId, menu.id);

    if (restaurant.restaurant_menu_id !== menu.id) {
      const { error: syncError } = await supabase
        .from("restaurants")
        .update({ restaurant_menu_id: menu.id })
        .eq("tenant_id", tenantId)
        .eq("id", restaurantId);

      if (syncError) {
        throw new Error(`Failed to sync restaurant menu id: ${syncError.message}`);
      }
    }

    return menu;
  }

  private async seedDefaultCategories(tenantId: string, menuId: string): Promise<void> {
    const supabase = getSupabaseAdminClient();
    const { data: existing, error: existingError } = await supabase
      .from("menu_categories")
      .select("name")
      .eq("tenant_id", tenantId)
      .eq("menu_id", menuId);

    if (existingError) {
      throw new Error(`Failed to read menu categories: ${existingError.message}`);
    }

    const existingNames = new Set(
      (existing ?? [])
        .map((row) => String((row as { name?: string }).name ?? "").trim())
        .filter((name) => name.length > 0)
    );

    const categoriesToInsert = DEFAULT_CATEGORY_NAMES.filter(
      (name) => !existingNames.has(name)
    ).map((name) => ({
      tenant_id: tenantId,
      menu_id: menuId,
      name,
    }));

    if (!categoriesToInsert.length) return;

    const { error: insertError } = await supabase
      .from("menu_categories")
      .insert(categoriesToInsert);

    if (insertError && insertError.code !== "23505") {
      throw new Error(`Failed to seed menu categories: ${insertError.message}`);
    }
  }

  private async loadMenuOutput(menu: MenuRow): Promise<OutputMenu> {
    const supabase = getSupabaseAdminClient();
    const [categoriesResult, itemsResult] = await Promise.all([
      supabase
        .from("menu_categories")
        .select("id, tenant_id, menu_id, name")
        .eq("tenant_id", menu.tenant_id)
        .eq("menu_id", menu.id)
        .order("name", { ascending: true }),
      supabase
        .from("menu_items")
        .select(
          "id, tenant_id, menu_id, category_id, name, description, ingredients, price, media_id, media_url, media_imgix_url"
        )
        .eq("tenant_id", menu.tenant_id)
        .eq("menu_id", menu.id)
        .order("created_at", { ascending: true }),
    ]);

    if (categoriesResult.error) {
      throw new Error(`Failed to read menu categories: ${categoriesResult.error.message}`);
    }
    if (itemsResult.error) {
      throw new Error(`Failed to read menu items: ${itemsResult.error.message}`);
    }

    const categories = (categoriesResult.data as MenuCategoryRow[] | null) ?? [];
    const categoryOutputs: OutputCategory[] = categories.map((category) => ({
      id: category.id,
      name: category.name,
    }));
    const categoriesById = new Map(categoryOutputs.map((category) => [category.id, category]));

    const items = ((itemsResult.data as MenuItemRow[] | null) ?? []).map((item) =>
      mapMenuItem(item, categoriesById)
    );

    return {
      id: menu.id,
      restaurantId: menu.restaurant_id,
      categories: categoryOutputs,
      items,
    };
  }
}
