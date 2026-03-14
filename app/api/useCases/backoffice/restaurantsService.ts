import { z } from "zod";
import type { AddMenuItemInput, OutputMenu } from "@/app/api/useCases/menu";
import { MenuService } from "@/app/api/useCases/menu";
import { prisma } from "@/app/api/infra/prisma/client";
import { failOutput, okOutput, type Output } from "@/lib/server/output";
import type {
  BackofficeMenuItemInput,
  BackofficeRestaurantDetail,
  BackofficeRestaurantSummary,
  UpdateBackofficeRestaurantInput,
} from "./types";

const updateRestaurantSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  ownerFullName: z.string().trim().min(2).max(120).optional(),
  email: z.string().trim().email().optional(),
  phoneNumber: z.string().trim().min(8).max(30).optional(),
  address: z.string().trim().min(4).max(240).optional(),
  addressNumber: z.string().trim().min(1).max(20).optional(),
  complement: z.string().trim().max(120).optional(),
  province: z.string().trim().min(2).max(120).optional(),
  postalCode: z.string().trim().min(8).max(12).optional(),
  lifecycleStatus: z.enum(["active", "inactive", "cancelled"]).optional(),
});

const addMenuItemSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(600).default(""),
  price: z.number().nonnegative(),
  ingredients: z.array(z.string().trim().min(1)).default([]),
  categoryId: z.string().uuid().nullable().optional(),
});

const mapRestaurantSummary = (restaurant: {
  id: string;
  tenantId: string;
  supabaseUserId: string | null;
  name: string;
  ownerFullName: string | null;
  email: string | null;
  phoneNumber: string | null;
  lifecycleStatus: "active" | "inactive" | "cancelled";
  registerDate: Date;
  tenant: { name: string };
  financialAccounts: Array<{ generalStatus: string }>;
  _count: { customerOrders: number };
}): BackofficeRestaurantSummary => ({
  id: restaurant.id,
  tenantId: restaurant.tenantId,
  tenantName: restaurant.tenant.name,
  supabaseUserId: restaurant.supabaseUserId,
  name: restaurant.name,
  ownerFullName: restaurant.ownerFullName ?? "",
  email: restaurant.email ?? "",
  phoneNumber: restaurant.phoneNumber ?? "",
  lifecycleStatus: restaurant.lifecycleStatus,
  registerDate: restaurant.registerDate.toISOString(),
  totalOrders: restaurant._count.customerOrders,
  financialStatus: restaurant.financialAccounts[0]?.generalStatus ?? null,
});

const mapRestaurantDetail = (restaurant: {
  id: string;
  tenantId: string;
  supabaseUserId: string | null;
  name: string;
  ownerFullName: string | null;
  email: string | null;
  phoneNumber: string | null;
  lifecycleStatus: "active" | "inactive" | "cancelled";
  lifecycleStatusChangedAt: Date | null;
  registerDate: Date;
  emailVerified: boolean;
  address: string | null;
  addressNumber: string | null;
  complement: string | null;
  province: string | null;
  postalCode: string | null;
  document: string | null;
  companyType: string | null;
  personType: string | null;
  financialOnboardingStartedAt: Date | null;
  financialOnboardingCompletedAt: Date | null;
  tenant: { name: string };
  financialAccounts: Array<{ id: string; generalStatus: string }>;
  _count: { customerOrders: number };
}): BackofficeRestaurantDetail => ({
  ...mapRestaurantSummary(restaurant),
  address: restaurant.address ?? "",
  addressNumber: restaurant.addressNumber ?? "",
  complement: restaurant.complement ?? "",
  province: restaurant.province ?? "",
  postalCode: restaurant.postalCode ?? "",
  document: restaurant.document ?? "",
  companyType: restaurant.companyType,
  personType: restaurant.personType ?? "",
  emailVerified: restaurant.emailVerified,
  lifecycleStatusChangedAt: restaurant.lifecycleStatusChangedAt?.toISOString() ?? null,
  financialOnboardingStartedAt: restaurant.financialOnboardingStartedAt?.toISOString() ?? null,
  financialOnboardingCompletedAt: restaurant.financialOnboardingCompletedAt?.toISOString() ?? null,
  latestFinancialAccountId: restaurant.financialAccounts[0]?.id ?? null,
});

export class BackofficeRestaurantsService {
  private readonly menuService = new MenuService();

  public async list(search?: string, status?: string): Promise<Output<BackofficeRestaurantSummary[]>> {
    const normalizedSearch = search?.trim();
    const normalizedStatus = status?.trim().toLowerCase();

    const restaurants = await prisma.restaurant.findMany({
      where: {
        ...(normalizedSearch
          ? {
              OR: [
                { name: { contains: normalizedSearch, mode: "insensitive" } },
                { email: { contains: normalizedSearch, mode: "insensitive" } },
                { ownerFullName: { contains: normalizedSearch, mode: "insensitive" } },
              ],
            }
          : {}),
        ...(normalizedStatus && normalizedStatus !== "all"
          ? { lifecycleStatus: normalizedStatus as "active" | "inactive" | "cancelled" }
          : {}),
      },
      orderBy: [{ createdAt: "desc" }],
      include: {
        tenant: { select: { name: true } },
        financialAccounts: {
          select: { generalStatus: true },
          take: 1,
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: { customerOrders: true },
        },
      },
      take: 200,
    });

    return okOutput(restaurants.map(mapRestaurantSummary));
  }

  public async getDetail(restaurantId: string): Promise<Output<BackofficeRestaurantDetail>> {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: {
        tenant: { select: { name: true } },
        financialAccounts: {
          select: { id: true, generalStatus: true },
          take: 1,
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: { customerOrders: true },
        },
      },
    });

    if (!restaurant) {
      return failOutput("Restaurant not found");
    }

    return okOutput(mapRestaurantDetail(restaurant));
  }

  public async update(
    restaurantId: string,
    input: UpdateBackofficeRestaurantInput
  ): Promise<Output<BackofficeRestaurantDetail>> {
    const parsed = updateRestaurantSchema.safeParse(input);
    if (!parsed.success) {
      return failOutput(parsed.error.issues.map((issue) => issue.message));
    }

    const existing = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: {
        id: true,
        lifecycleStatus: true,
      },
    });

    if (!existing) {
      return failOutput("Restaurant not found");
    }

    await prisma.restaurant.update({
      where: { id: restaurantId },
      data: {
        ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
        ...(parsed.data.ownerFullName !== undefined
          ? { ownerFullName: parsed.data.ownerFullName }
          : {}),
        ...(parsed.data.email !== undefined ? { email: parsed.data.email.toLowerCase() } : {}),
        ...(parsed.data.phoneNumber !== undefined ? { phoneNumber: parsed.data.phoneNumber } : {}),
        ...(parsed.data.address !== undefined ? { address: parsed.data.address } : {}),
        ...(parsed.data.addressNumber !== undefined
          ? { addressNumber: parsed.data.addressNumber }
          : {}),
        ...(parsed.data.complement !== undefined ? { complement: parsed.data.complement } : {}),
        ...(parsed.data.province !== undefined ? { province: parsed.data.province } : {}),
        ...(parsed.data.postalCode !== undefined ? { postalCode: parsed.data.postalCode } : {}),
        ...(parsed.data.lifecycleStatus !== undefined
          ? {
              lifecycleStatus: parsed.data.lifecycleStatus,
              lifecycleStatusChangedAt:
                parsed.data.lifecycleStatus !== existing.lifecycleStatus ? new Date() : undefined,
            }
          : {}),
      },
    });

    return this.getDetail(restaurantId);
  }

  public async getMenu(restaurantId: string): Promise<Output<OutputMenu>> {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { tenantId: true },
    });

    if (!restaurant) {
      return failOutput("Restaurant not found");
    }

    return this.menuService.getMenuByRestaurantId(restaurant.tenantId, restaurantId);
  }

  public async addMenuItem(
    restaurantId: string,
    input: BackofficeMenuItemInput
  ): Promise<Output<OutputMenu>> {
    const parsed = addMenuItemSchema.safeParse(input);
    if (!parsed.success) {
      return failOutput(parsed.error.issues.map((issue) => issue.message));
    }

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { tenantId: true },
    });

    if (!restaurant) {
      return failOutput("Restaurant not found");
    }

    const serviceInput: AddMenuItemInput = {
      restaurantId,
      item: {
        name: parsed.data.name,
        description: parsed.data.description,
        price: parsed.data.price,
        ingredients: parsed.data.ingredients,
        categoryId: parsed.data.categoryId ?? null,
        itemMedia: null,
      },
    };

    return this.menuService.addItem(restaurant.tenantId, serviceInput);
  }

  public async deleteMenuItem(
    restaurantId: string,
    itemId: string
  ): Promise<Output<null>> {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { tenantId: true },
    });

    if (!restaurant) {
      return failOutput("Restaurant not found");
    }

    return this.menuService.deleteItem(restaurant.tenantId, itemId);
  }
}
