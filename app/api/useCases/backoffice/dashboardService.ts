import { prisma } from "@/app/api/infra/prisma/client";
import { okOutput, type Output } from "@/lib/server/output";
import type { BackofficeDashboardMetricsOutput, BackofficeMetricsPeriod } from "./types";

const toStartDate = (period: BackofficeMetricsPeriod): Date => {
  const now = new Date();
  const start = new Date(now);

  if (period === "7d") {
    start.setDate(now.getDate() - 7);
    return start;
  }

  if (period === "30d") {
    start.setDate(now.getDate() - 30);
    return start;
  }

  start.setMonth(now.getMonth() - 6);
  return start;
};

export class BackofficeDashboardService {
  public async getMetrics(
    period: BackofficeMetricsPeriod
  ): Promise<Output<BackofficeDashboardMetricsOutput>> {
    const startDate = toStartDate(period);
    const endDate = new Date();

    const [newClients, clientsExited, totalOrders, groupedOrders] = await Promise.all([
      prisma.restaurant.count({
        where: {
          registerDate: {
            gte: startDate,
            lte: endDate,
          },
        },
      }),
      prisma.restaurant.count({
        where: {
          lifecycleStatus: {
            in: ["inactive", "cancelled"],
          },
          lifecycleStatusChangedAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      }),
      prisma.customerOrder.count({
        where: {
          orderDate: {
            gte: startDate,
            lte: endDate,
          },
        },
      }),
      prisma.customerOrder.groupBy({
        by: ["restaurantId"],
        where: {
          orderDate: {
            gte: startDate,
            lte: endDate,
          },
        },
        _count: {
          _all: true,
        },
      }),
    ]);

    const restaurantIds = groupedOrders.map((entry) => entry.restaurantId);
    const restaurants = restaurantIds.length
      ? await prisma.restaurant.findMany({
          where: {
            id: {
              in: restaurantIds,
            },
          },
          select: {
            id: true,
            name: true,
          },
        })
      : [];

    const restaurantsById = new Map(restaurants.map((restaurant) => [restaurant.id, restaurant.name]));

    const ordersByRestaurant = groupedOrders
      .map((entry) => ({
        restaurantId: entry.restaurantId,
        restaurantName: restaurantsById.get(entry.restaurantId) ?? "Restaurante",
        totalOrders: entry._count._all,
      }))
      .sort((left, right) => right.totalOrders - left.totalOrders);

    return okOutput({
      period,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      newClients,
      clientsExited,
      totalOrders,
      ordersByRestaurant,
    });
  }
}
