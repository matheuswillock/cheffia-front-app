import { OrderPrintService } from "@/app/api/services/orderPrint";
import { describe, expect, test } from "bun:test";
import { OrderPrintJobsUseCase } from "@/app/api/useCases/orderPrint";
import type { OrderPrintJobRecord } from "@/app/api/infra/persistence/orderPrint";
import type { ClaimOrderPrintJobInput, CompleteOrderPrintJobInput } from "@/lib/printing/jobContracts";

const createUseCaseWithFakes = () => {
  const jobs = new Map<string, OrderPrintJobRecord>();
  const byKey = new Map<string, string>();

  const readRepository = {
    findEventById: async (_tenantId: string, eventId: string) => ({
      eventId,
      tenantId: "tenant-1",
      restaurantId: "rest-1",
      customerOrderId: "order-1",
      eventType: "order.sent",
      createdAt: "2026-03-14T10:00:00.000Z",
    }),
    findOrderById: async () => ({
      customerOrderId: "order-1",
      restaurantId: "rest-1",
      orderDateTime: "2026-03-14T10:00:00.000Z",
      orderNumber: 1,
      tableOrCounter: "12",
      items: [
        {
          quantity: 1,
          itemName: "Burger",
          observation: "sem cebola",
        },
      ],
    }),
  };

  const keyOf = (tenantId: string, eventId: string, printerId: string) =>
    `${tenantId}|${eventId}|${printerId}`;

  const repository = {
    findByEventAndPrinter: async (tenantId: string, eventId: string, printerId: string) => {
      const key = keyOf(tenantId, eventId, printerId);
      const id = byKey.get(key);
      if (!id) return null;
      return jobs.get(id) ?? null;
    },
    findById: async (_tenantId: string, jobId: string) => jobs.get(jobId) ?? null,
    createClaimed: async (input: {
      tenantId: string;
      eventId: string;
      restaurantId: string;
      printerId: string;
      payloadSnapshot: unknown;
    }) => {
      const key = keyOf(input.tenantId, input.eventId, input.printerId);
      const already = byKey.get(key);
      if (already) return jobs.get(already)!;

      const id = `job-${jobs.size + 1}`;
      const created: OrderPrintJobRecord = {
        id,
        tenantId: input.tenantId,
        eventId: input.eventId,
        restaurantId: input.restaurantId,
        printerId: input.printerId,
        status: "claimed",
        attemptCount: 0,
        lastError: null,
        payloadSnapshot: input.payloadSnapshot,
        claimedAt: new Date().toISOString(),
        printedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      byKey.set(key, id);
      jobs.set(id, created);
      return created;
    },
    touchClaimed: async (input: { tenantId: string; jobId: string; payloadSnapshot: unknown }) => {
      const current = jobs.get(input.jobId)!;
      const touched: OrderPrintJobRecord = {
        ...current,
        tenantId: input.tenantId,
        status: "claimed",
        payloadSnapshot: input.payloadSnapshot,
        lastError: null,
        updatedAt: new Date().toISOString(),
      };
      jobs.set(input.jobId, touched);
      return touched;
    },
    markPrinted: async (_tenantId: string, jobId: string) => {
      const current = jobs.get(jobId)!;
      const updated: OrderPrintJobRecord = {
        ...current,
        status: "printed",
        attemptCount: current.attemptCount + 1,
        printedAt: new Date().toISOString(),
        lastError: null,
        updatedAt: new Date().toISOString(),
      };
      jobs.set(jobId, updated);
      return updated;
    },
    markFailed: async (_tenantId: string, jobId: string, errorMessage: string) => {
      const current = jobs.get(jobId)!;
      const updated: OrderPrintJobRecord = {
        ...current,
        status: "failed",
        attemptCount: current.attemptCount + 1,
        lastError: errorMessage,
        updatedAt: new Date().toISOString(),
      };
      jobs.set(jobId, updated);
      return updated;
    },
  };

  const useCase = new OrderPrintJobsUseCase(readRepository as any, repository as any, new OrderPrintService());
  return { useCase };
};

describe("Order print use case", () => {
  test("claim is idempotent and blocks auto duplicate when already printed", async () => {
    const { useCase } = createUseCaseWithFakes();

    const claimInput: ClaimOrderPrintJobInput = {
      restaurantId: "rest-1",
      eventId: "evt-1",
      printerId: "kitchen-default",
    };

    const firstClaim = await useCase.claim("tenant-1", claimInput);
    expect(firstClaim.isValid).toBe(true);
    expect(firstClaim.result?.shouldPrint).toBe(true);
    expect(firstClaim.result?.replayed).toBe(false);

    const completeInput: CompleteOrderPrintJobInput = {
      restaurantId: "rest-1",
      jobId: firstClaim.result!.jobId,
      status: "printed",
      errorMessage: null,
    };

    const completed = await useCase.complete("tenant-1", completeInput);
    expect(completed.isValid).toBe(true);
    expect(completed.result?.status).toBe("printed");

    const secondClaim = await useCase.claim("tenant-1", claimInput);
    expect(secondClaim.isValid).toBe(true);
    expect(secondClaim.result?.replayed).toBe(true);
    expect(secondClaim.result?.shouldPrint).toBe(false);
    expect(secondClaim.result?.status).toBe("printed");
  });

  test("failed then successful completion increments attempts", async () => {
    const { useCase } = createUseCaseWithFakes();

    const claim = await useCase.claim("tenant-1", {
      restaurantId: "rest-1",
      eventId: "evt-2",
      printerId: "kitchen-default",
    });

    const failed = await useCase.complete("tenant-1", {
      restaurantId: "rest-1",
      jobId: claim.result!.jobId,
      status: "failed",
      errorMessage: "offline",
    });

    expect(failed.isValid).toBe(true);
    expect(failed.result?.status).toBe("failed");
    expect(failed.result?.attemptCount).toBe(1);

    const reClaim = await useCase.claim("tenant-1", {
      restaurantId: "rest-1",
      eventId: "evt-2",
      printerId: "kitchen-default",
    });

    expect(reClaim.isValid).toBe(true);
    expect(reClaim.result?.shouldPrint).toBe(true);

    const printed = await useCase.complete("tenant-1", {
      restaurantId: "rest-1",
      jobId: claim.result!.jobId,
      status: "printed",
      errorMessage: null,
    });

    expect(printed.isValid).toBe(true);
    expect(printed.result?.status).toBe("printed");
    expect(printed.result?.attemptCount).toBe(2);
  });
});

