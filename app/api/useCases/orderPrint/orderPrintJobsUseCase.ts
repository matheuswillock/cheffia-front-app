import {
  PrismaOrderPrintReadRepository,
  SupabaseOrderPrintJobRepository,
  type OrderPrintJobRecord,
} from "@/app/api/infra/persistence/orderPrint";
import { OrderPrintService } from "@/app/api/services/orderPrint";
import type {
  ClaimOrderPrintJobInput,
  ClaimOrderPrintJobOutput,
  CompleteOrderPrintJobInput,
  CompleteOrderPrintJobOutput,
  ReprintOrderPrintJobInput,
} from "@/lib/printing/jobContracts";
import { failOutput, okOutput, type Output } from "@/lib/server/output";

const DEFAULT_PRINTER_ID = "kitchen-default";

const sanitizePrinterId = (value: string | null | undefined): string => {
  const trimmed = (value ?? "").trim();
  return trimmed.length ? trimmed : DEFAULT_PRINTER_ID;
};

const toClaimOutput = (
  record: OrderPrintJobRecord,
  eventId: string,
  printPayload: ClaimOrderPrintJobOutput["printPayload"],
  replayed: boolean,
  shouldPrint: boolean
): ClaimOrderPrintJobOutput => ({
  jobId: record.id,
  eventId,
  restaurantId: record.restaurantId,
  printerId: record.printerId,
  status: record.status,
  shouldPrint,
  replayed,
  attemptCount: record.attemptCount,
  lastError: record.lastError,
  printPayload,
});

const toCompleteOutput = (record: OrderPrintJobRecord): CompleteOrderPrintJobOutput => ({
  jobId: record.id,
  eventId: record.eventId,
  restaurantId: record.restaurantId,
  printerId: record.printerId,
  status: record.status,
  attemptCount: record.attemptCount,
  lastError: record.lastError,
});

export class OrderPrintJobsUseCase {
  constructor(
    private readonly readRepository: PrismaOrderPrintReadRepository = new PrismaOrderPrintReadRepository(),
    private readonly jobRepository: SupabaseOrderPrintJobRepository = new SupabaseOrderPrintJobRepository(),
    private readonly service: OrderPrintService = new OrderPrintService()
  ) {}

  public async claim(
    tenantId: string,
    input: ClaimOrderPrintJobInput,
    options: { forceReprint?: boolean } = {}
  ): Promise<Output<ClaimOrderPrintJobOutput>> {
    try {
      const printerId = sanitizePrinterId(input.printerId);
      const event = await this.readRepository.findEventById(tenantId, input.eventId);

      if (!event) {
        return failOutput("Order print event not found");
      }

      if (!this.service.isSupportedEventType(event.eventType)) {
        return failOutput(`Unsupported event type for printing: ${event.eventType}`);
      }

      if (event.restaurantId !== input.restaurantId) {
        return failOutput("Event restaurantId does not match request restaurantId");
      }

      const order = await this.readRepository.findOrderById(
        tenantId,
        input.restaurantId,
        event.customerOrderId
      );

      if (!order) {
        return failOutput("Order snapshot not found for printing");
      }

      const ticketPayload = this.service.buildTicketPayload(event, order);

      const existing = await this.jobRepository.findByEventAndPrinter(tenantId, event.eventId, printerId);
      if (existing) {
        if (existing.status === "printed" && !options.forceReprint) {
          return okOutput(
            toClaimOutput(existing, event.eventId, null, true, false),
            ["Print job already completed"]
          );
        }

        const touched = await this.jobRepository.touchClaimed({
          tenantId,
          jobId: existing.id,
          payloadSnapshot: ticketPayload,
        });

        return okOutput(
          toClaimOutput(touched, event.eventId, ticketPayload, true, true),
          options.forceReprint ? ["Print job claimed for reprint"] : ["Print job claimed"]
        );
      }

      const created = await this.jobRepository.createClaimed({
        tenantId,
        eventId: event.eventId,
        restaurantId: event.restaurantId,
        printerId,
        payloadSnapshot: ticketPayload,
      });

      return okOutput(toClaimOutput(created, event.eventId, ticketPayload, false, true), ["Print job claimed"]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected claim error";
      return failOutput(`Error while claiming print job - ${message}`);
    }
  }

  public async complete(
    tenantId: string,
    input: CompleteOrderPrintJobInput
  ): Promise<Output<CompleteOrderPrintJobOutput>> {
    try {
      const current = await this.jobRepository.findById(tenantId, input.jobId);

      if (!current) {
        return failOutput("Print job not found");
      }

      if (current.restaurantId !== input.restaurantId) {
        return failOutput("Print job restaurantId does not match request restaurantId");
      }

      if (input.status === "printed") {
        if (current.status === "printed") {
          return okOutput(toCompleteOutput(current), ["Print job already marked as printed"]);
        }

        const updated = await this.jobRepository.markPrinted(tenantId, current.id);
        return okOutput(toCompleteOutput(updated), ["Print job marked as printed"]);
      }

      const message = (input.errorMessage ?? "Print execution failed").trim();
      const updated = await this.jobRepository.markFailed(
        tenantId,
        current.id,
        message.length ? message : "Print execution failed"
      );

      return okOutput(toCompleteOutput(updated), ["Print job marked as failed"]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected complete error";
      return failOutput(`Error while completing print job - ${message}`);
    }
  }

  public async reprint(
    tenantId: string,
    input: ReprintOrderPrintJobInput
  ): Promise<Output<ClaimOrderPrintJobOutput>> {
    const printerId = sanitizePrinterId(input.printerId);
    const existing = await this.jobRepository.findByEventAndPrinter(tenantId, input.eventId, printerId);

    if (!existing) {
      return failOutput("Reprint is only available after the first claimed print job");
    }

    return this.claim(
      tenantId,
      {
        restaurantId: input.restaurantId,
        eventId: input.eventId,
        printerId,
      },
      { forceReprint: true }
    );
  }
}
