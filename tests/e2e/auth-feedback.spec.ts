import { expect, test } from "@playwright/test"

test("desktop backstage call focuses the login form", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto("/sign-in")
  await page.getByRole("button", { name: "Feito para quem faz acontecer" }).click()
  await expect(page.getByLabel("Email")).toBeFocused()
  const footer = page.getByText(/Mais presença\. Menos ruído\./)
  expect((await footer.boundingBox())!.y + (await footer.boundingBox())!.height).toBeLessThanOrEqual(900)
})

for (const viewport of [{ width: 1440, height: 900 }, { width: 375, height: 812 }]) {
  test(`signup validation error stays legible at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await page.goto("/sign-up")
    await page.getByLabel("Email").fill("teste@exemplo.com")
    await page.getByLabel("Senha", { exact: true }).fill("SenhaSegura1!")
    await page.getByLabel("Confirme sua senha").fill("OutraSenha1!")
    await page.getByRole("button", { name: "Criar minha conta" }).click()

    const error = page.getByRole("alert").filter({ hasText: "As senhas não conferem" })
    await expect(error).toBeVisible()
    await expect(error).toHaveCSS("color", "rgb(254, 242, 242)")
    await expect(error).toHaveCSS("background-color", "rgb(127, 29, 29)")
    await expect(page.getByRole("button", { name: "Criar minha conta" })).toBeEnabled()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  })
}
