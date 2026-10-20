import { expect, test } from "@playwright/test"

test.describe("ordering vertical slice with local fixtures", () => {
  test.skip(!process.env.E2E_TABLE_TOKEN, "requires scripts/e2e-local.mjs fixtures")

  test("customer submits an order, kitchen confirms it, and customer resyncs status", async ({ browser }) => {
    const customerContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
    })
    const customer = await customerContext.newPage()

    await customer.goto(`/table/${process.env.E2E_TABLE_TOKEN}`)
    await expect(customer).toHaveURL(/\/restaurant\/menu\/e2e-demo/)
    await expect(customer.getByText("Burger E2E")).toBeVisible()

    await customer.getByRole("button", { name: "Adicionar Burger E2E" }).click()
    const orderResponsePromise = customer.waitForResponse(
      (response) => response.url().endsWith("/api/public/orders") && response.request().method() === "POST",
    )
    const realtimeTokenPromise = customer.waitForResponse(
      (response) => response.url().includes("/realtime-token") && response.request().method() === "GET",
    )
    await customer.getByRole("button", { name: "Enviar pedido" }).click()
    const orderResponse = await orderResponsePromise
    expect(orderResponse.status()).toBe(201)
    const order = await orderResponse.json() as { orderId: string; status: string }
    expect((await realtimeTokenPromise).status()).toBe(200)
    await expect(customer.getByRole("status")).toContainText("pending")

    const kitchenContext = await browser.newContext()
    const kitchen = await kitchenContext.newPage()
    await kitchen.goto("/sign-in")
    await kitchen.getByLabel("Email").fill(process.env.E2E_STAFF_EMAIL as string)
    await kitchen.getByLabel("Senha").fill(process.env.E2E_STAFF_PASSWORD as string)
    await kitchen.getByRole("button", { name: "Login", exact: true }).click()
    await kitchen.waitForURL(/\/dashboard/)
    await kitchen.goto("/restaurant/order-hub/e2e-demo")

    await expect(kitchen.getByText("Mesa E2E")).toBeVisible()
    await kitchen.getByRole("button", { name: `Confirmar pedido ${order.orderId}` }).click()
    await expect(kitchen.getByText("Confirmado")).toBeVisible()

    await expect(customer.getByRole("status")).toContainText("confirmed", { timeout: 15_000 })

    await kitchenContext.close()
    await customerContext.close()
  })
})
