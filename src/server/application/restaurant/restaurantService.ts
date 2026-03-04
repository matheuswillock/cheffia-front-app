import { randomInt, randomUUID } from "crypto";
import { z } from "zod";
import { getSupabaseAdminClient } from "@/server/infra/supabase/adminClient";
import { failOutput, okOutput, type Output } from "@/server/shared/output";
import type { RegisterRestaurantInput, RestaurantOutput } from "./types";

const registerSchema = z.object({
  name: z.string().min(3),
  address: z.string().min(4),
  phoneNumber: z.string().min(8),
  email: z.string().email(),
  emailVerified: z.boolean().default(false),
  supabaseId: z.string().uuid(),
  ownerFullName: z.string().min(3),
  document: z.string().min(11).max(18),
  providerAvatarUrl: z.string().optional().default(""),
});

interface RestaurantRow {
  id: string;
  tenant_id: string;
  supabase_user_id: string | null;
  name: string;
  address: string | null;
  phone_number: string | null;
  email: string | null;
  owner_full_name: string | null;
  document: string | null;
  verification_code: string | null;
  email_verified: boolean;
  register_date: string;
  provider_avatar_url: string | null;
  restaurant_menu_id: string | null;
  restaurant_kitchen_id: string | null;
}

const validateDocument = (document: string): boolean => {
  const onlyDigits = document.replace(/\D/g, "");
  return /^\d{11}$/.test(onlyDigits) || /^\d{14}$/.test(onlyDigits);
};

const mapRestaurant = (row: RestaurantRow): RestaurantOutput => ({
  id: row.id,
  name: row.name,
  address: row.address ?? "",
  phoneNumber: row.phone_number ?? "",
  document: row.document ?? "",
  providerAvatarUrl: row.provider_avatar_url ?? "",
  ownerFullName: row.owner_full_name ?? "",
  email: row.email ?? "",
  emailVerified: row.email_verified,
  supabaseId: row.supabase_user_id ?? "",
  customerOrders: [],
  registerDate: row.register_date,
  restaurantKitchen: row.restaurant_kitchen_id ?? "",
  restaurantMenu: row.restaurant_menu_id ?? "",
  verificationCode: row.verification_code ?? "",
});

const toTenantSlug = (supabaseId: string): string =>
  `restaurant-${supabaseId.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

const ensureTenant = async (
  explicitTenantId: string | null,
  supabaseId: string
): Promise<string> => {
  if (explicitTenantId) return explicitTenantId;

  const supabase = getSupabaseAdminClient();
  const slug = toTenantSlug(supabaseId);

  const { data: existing, error: findError } = await supabase
    .from("tenants")
    .select("id")
    .eq("slug", slug)
    .maybeSingle<{ id: string }>();

  if (findError) {
    throw new Error(`Failed to lookup tenant: ${findError.message}`);
  }

  if (existing?.id) return existing.id;

  const { data: created, error: createError } = await supabase
    .from("tenants")
    .insert({
      slug,
      name: `Restaurant ${supabaseId.slice(0, 8)}`,
      is_active: true,
    })
    .select("id")
    .single<{ id: string }>();

  if (createError) {
    throw new Error(`Failed to create tenant: ${createError.message}`);
  }

  return created.id;
};

export class RestaurantService {
  public async getTenantByRestaurantId(restaurantId: string): Promise<string | null> {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("restaurants")
      .select("tenant_id")
      .eq("id", restaurantId)
      .maybeSingle<{ tenant_id: string }>();

    if (error) throw new Error(`Tenant lookup by restaurant failed: ${error.message}`);
    return data?.tenant_id ?? null;
  }

  public async getTenantBySupabaseId(supabaseId: string): Promise<string | null> {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("restaurants")
      .select("tenant_id")
      .eq("supabase_user_id", supabaseId)
      .maybeSingle<{ tenant_id: string }>();

    if (error) throw new Error(`Tenant lookup by supabaseId failed: ${error.message}`);
    return data?.tenant_id ?? null;
  }

  public async getTenantByVerificationCode(token: string): Promise<string | null> {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("restaurants")
      .select("tenant_id")
      .eq("verification_code", token)
      .maybeSingle<{ tenant_id: string }>();

    if (error) throw new Error(`Tenant lookup by token failed: ${error.message}`);
    return data?.tenant_id ?? null;
  }

  public async requestBySupabaseId(
    tenantId: string,
    supabaseId: string
  ): Promise<Output<RestaurantOutput>> {
    const supabase = getSupabaseAdminClient();

    const { data, error } = await supabase
      .from("restaurants")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("supabase_user_id", supabaseId)
      .maybeSingle<RestaurantRow>();

    if (error) {
      return failOutput(`Error requesting restaurant by ID - ${error.message}`);
    }

    if (!data) {
      return failOutput("Restaurant not found");
    }

    return okOutput(mapRestaurant(data));
  }

  public async register(
    input: unknown,
    tenantIdFromContext: string | null
  ): Promise<Output<{ restaurantId: string }>> {
    const parsed = registerSchema.safeParse(input);
    if (!parsed.success) {
      return failOutput(parsed.error.issues.map((issue) => issue.message));
    }

    const data: RegisterRestaurantInput = {
      ...parsed.data,
      document: parsed.data.document.replace(/\D/g, ""),
      providerAvatarUrl: parsed.data.providerAvatarUrl ?? "",
    };

    if (!validateDocument(data.document)) {
      return failOutput("Invalid document");
    }

    const tenantId = await ensureTenant(tenantIdFromContext, data.supabaseId);
    const supabase = getSupabaseAdminClient();

    const { data: existing, error: existsError } = await supabase
      .from("restaurants")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("email", data.email)
      .eq("document", data.document)
      .eq("supabase_user_id", data.supabaseId)
      .maybeSingle<{ id: string }>();

    if (existsError) {
      return failOutput(`Error checking restaurant existence - ${existsError.message}`);
    }

    if (existing?.id) {
      return failOutput("Restaurant already exists");
    }

    const verificationCode = String(randomInt(1000, 100000));

    const { data: inserted, error: insertError } = await supabase
      .from("restaurants")
      .insert({
        tenant_id: tenantId,
        supabase_user_id: data.supabaseId,
        name: data.name,
        address: data.address,
        phone_number: data.phoneNumber,
        email: data.email,
        owner_full_name: data.ownerFullName,
        document: data.document,
        verification_code: verificationCode,
        email_verified: data.emailVerified,
        register_date: new Date().toISOString(),
        provider_avatar_url: data.providerAvatarUrl,
        restaurant_menu_id: randomUUID(),
        restaurant_kitchen_id: randomUUID(),
      })
      .select("id")
      .single<{ id: string }>();

    if (insertError) {
      return failOutput(`Error adding restaurant - ${insertError.message}`);
    }

    return okOutput(
      { restaurantId: inserted.id },
      ["Restaurant added successfully"]
    );
  }

  public async confirmEmail(tenantId: string, token: string): Promise<boolean> {
    const supabase = getSupabaseAdminClient();

    const { data: found, error: findError } = await supabase
      .from("restaurants")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("verification_code", token)
      .maybeSingle<{ id: string }>();

    if (findError) {
      throw new Error(`Confirm email lookup failed: ${findError.message}`);
    }

    if (!found?.id) return false;

    const { error: updateError } = await supabase
      .from("restaurants")
      .update({ email_verified: true })
      .eq("id", found.id)
      .eq("tenant_id", tenantId);

    if (updateError) {
      throw new Error(`Confirm email update failed: ${updateError.message}`);
    }

    return true;
  }

  public async deleteRestaurant(
    tenantId: string,
    restaurantId: string
  ): Promise<Output<null>> {
    const supabase = getSupabaseAdminClient();

    const { data: found, error: findError } = await supabase
      .from("restaurants")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("id", restaurantId)
      .maybeSingle<{ id: string }>();

    if (findError) {
      return failOutput(`Error deleting restaurant by ID - ${findError.message}`);
    }

    if (!found?.id) {
      return failOutput("Restaurant not found");
    }

    const { error: deleteError } = await supabase
      .from("restaurants")
      .delete()
      .eq("tenant_id", tenantId)
      .eq("id", restaurantId);

    if (deleteError) {
      return failOutput(`Error deleting restaurant by ID - ${deleteError.message}`);
    }

    return okOutput<null>(null, ["Restaurant deleted successfully"]);
  }
}
