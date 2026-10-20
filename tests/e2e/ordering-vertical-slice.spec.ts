import { expect, test } from "@playwright/test"
import { requireCreatedOrder, requireE2EEnvironment } from "../../scripts/e2e-preflight.mjs"

test.describe("ordering vertical slice with local fixtures", () => {
  test.skip(!process.env.E2E_TABLE_TOKEN, "requires scripts/e2e-local.mjs fixtures")

  test("customer submits an order, kitchen confirms it, and customer resyncs status", async ({ browser }) => {
    const tableToken = requireE2EEnvironment(process.env, "E2E_TABLE_TOKEN")
    const staffEmail = requireE2EEnvironment(process.env, "E2E_STAFF_EMAIL")
    const staffPassword = requireE2EEnvironment(process.env, "E2E_STAFF_PASSWORD")
    const customerContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
    })
    const customer = await customerContext.newPage()

    await customer.goto(`/table/${tableToken}`)
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
    const order = requireCreatedOrder(await orderResponse.json())
    expect((await realtimeTokenPromise).status()).toBe(200)
    await expect(customer.getByRole("status")).toContainText("pending")

    const kitchenContext = await browser.newContext()
    const kitchen = await kitchenContext.newPage()
    await kitchen.goto("/sign-in")
    await kitchen.getByLabel("Email").fill(staffEmail)
    await kitchen.getByLabel("Senha").fill(staffPassword)
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
