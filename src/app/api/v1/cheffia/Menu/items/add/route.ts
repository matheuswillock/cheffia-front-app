import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { MenuService, type AddMenuItemInput } from "@/server/application/menu";
import { executeWithIdempotency } from "@/server/shared/idempotency";
import { fromThrowable } from "@/server/shared/output";
import { requireTenantContext } from "@/server/shared/tenant";
import { SupabaseIdempotencyRepository } from "@/server/infra/persistence/idempotency/supabaseIdempotencyRepository";

export const runtime = "nodejs";

const mediaMetadataSchema = z.object({
  name: z.string().trim().min(1),
  contentType: z.string().trim().default("application/octet-stream"),
  size: z.number().nonnegative(),
});

const addMenuItemInputSchema = z.object({
  restaurantId: z.string().uuid(),
  item: z.object({
    name: z.string().trim().min(1),
    description: z.string().trim().default(""),
    price: z.number().finite().nonnegative(),
    ingredients: z.array(z.string().trim()).default([]),
    categoryId: z.string().uuid().nullable(),
    itemMedia: mediaMetadataSchema.nullable(),
  }),
});

const getFormString = (formData: FormData, key: string): string | null => {
  const value = formData.get(key);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const parseIngredients = (formData: FormData): string[] => {
  const values = formData
    .getAll("Item.Ingredients")
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

  if (!values.length) return [];
  if (values.length > 1) return values;

  const single = values[0];

  try {
    const parsed = JSON.parse(single) as unknown;
    if (Array.isArray(parsed)) {
      return parsed
        .map((value) => (typeof value === "string" ? value.trim() : String(value)))
        .filter((value) => value.length > 0);
    }
  } catch {
    // ignore and fallback to plain string parsing
  }

  if (single.includes(",")) {
    return single
      .split(",")
      .map((value) => value.trim())
      .filter((value) => value.length > 0);
  }

  return [single];
};

const parseInput = async (request: NextRequest): Promise<z.infer<typeof addMenuItemInputSchema>> => {
  const formData = await request.formData();
  const media = formData.get("Item.ItemMedia");

  const parsed = addMenuItemInputSchema.safeParse({
    restaurantId: getFormString(formData, "RestaurantId"),
    item: {
      name: getFormString(formData, "Item.Name"),
      description: getFormString(formData, "Item.Description") ?? "",
      price: Number(getFormString(formData, "Item.Price")),
      ingredients: parseIngredients(formData),
      categoryId: getFormString(formData, "Item.CategoryId"),
      itemMedia:
        media instanceof File && media.size > 0
          ? {
              name: media.name,
              contentType: media.type || "application/octet-stream",
              size: media.size,
            }
          : null,
    },
  });

  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => issue.message).join("; ");
    throw new Error(`Invalid menu item input: ${issues}`);
  }

  return parsed.data;
};

export async function POST(request: NextRequest) {
  const service = new MenuService();
  const idempotencyKey = request.headers.get("idempotency-key")?.trim() ?? null;

  try {
    const parsedInput = await parseInput(request);
    const input: AddMenuItemInput = parsedInput;

    const tenant = await requireTenantContext({
      request,
      routeParams: { restaurantId: input.restaurantId },
      resolveTenantIdFromRestaurantId: (restaurantId) => service.getTenantByRestaurantId(restaurantId),
    });

    if (!idempotencyKey) {
      const output = await service.addItem(tenant.tenantId, input);
      return NextResponse.json(output, { status: output.isValid ? 200 : 400 });
    }

    const repository = new SupabaseIdempotencyRepository();
    const executed = await executeWithIdempotency({
      tenantId: tenant.tenantId,
      method: "POST",
      endpoint: "/api/v1/cheffia/Menu/items/add",
      idempotencyKey,
      payloadForHash: input,
      repository,
      execute: async () => {
        const output = await service.addItem(tenant.tenantId, input);
        return { output, statusCode: output.isValid ? 200 : 400 };
      },
    });

    return NextResponse.json(executed.output, { status: executed.statusCode });
  } catch (error) {
    return NextResponse.json(fromThrowable(error), { status: 500 });
  }
}
