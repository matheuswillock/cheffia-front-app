import { describe, expect, test } from "bun:test";
import { formatOrderTicket, resolveCharsPerLine } from "@/lib/printing/formatTicket";
import { OrderPrintService } from "@/app/api/services/orderPrint";

const basePayload = {
  eventId: "00000000-0000-0000-0000-000000000001",
  restaurantId: "00000000-0000-0000-0000-000000000002",
  customerOrderId: "00000000-0000-0000-0000-000000000003",
  orderNumber: 42,
  orderDateTime: "2026-03-14T15:30:00.000Z",
  tableOrCounter: "12",
  serviceMode: "Nao informado",
  items: [
    {
      quantity: 2,
      itemName: "X-Burger",
      observation: "sem cebola, adicionar bacon",
    },
  ],
};

describe("Order print ticket formatter", () => {
  test("formats ticket using 58mm width", () => {
    const chars = resolveCharsPerLine("58mm");
    const ticket = formatOrderTicket(basePayload, { profile: "58mm" });
    const lines = ticket.split("\n");

    expect(chars).toBe(32);
    expect(lines[1]?.length ?? 0).toBe(32);
  });

  test("formats ticket using 80mm width", () => {
    const chars = resolveCharsPerLine("80mm");
    const ticket = formatOrderTicket(basePayload, { profile: "80mm" });
    const lines = ticket.split("\n");

    expect(chars).toBe(48);
    expect(lines[1]?.length ?? 0).toBe(48);
  });

  test("highlights item observation", () => {
    const ticket = formatOrderTicket(basePayload, { profile: "80mm" });
    expect(ticket).toContain("! OBS: SEM CEBOLA, ADICIONAR BACON");
  });

  test("defaults service mode to Nao informado in print payload builder", () => {
    const service = new OrderPrintService();

    const payload = service.buildTicketPayload(
      {
        eventId: "evt-1",
        tenantId: "tenant-1",
        restaurantId: "rest-1",
        customerOrderId: "order-1",
        eventType: "order.sent",
        createdAt: "2026-03-14T00:00:00.000Z",
      },
      {
        customerOrderId: "order-1",
        restaurantId: "rest-1",
        orderDateTime: "2026-03-14T00:00:00.000Z",
        orderNumber: 5,
        tableOrCounter: "balcao",
        items: [
          {
            quantity: 1,
            itemName: "Cafe",
            observation: "",
          },
        ],
      }
    );

    expect(payload.serviceMode).toBe("Nao informado");
  });
});
