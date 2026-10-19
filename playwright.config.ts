import { defineConfig, devices } from "@playwright/test"

const baseURL = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3000"
const port = new URL(baseURL).port || "3000"

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.PLAYWRIGHT_JSON_REPORT
    ? [["json", { outputFile: process.env.PLAYWRIGHT_JSON_REPORT }]]
    : process.env.CI
      ? "github"
      : "list",
  use: {
    baseURL,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: `bunx next dev -p ${port}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      STRIPE_PUBLISHABLE_KEY: "pk_test_ci_placeholder",
      STRIPE_SECRET_KEY: "sk_test_ci_placeholder",
      NEXT_PUBLIC_API_URL: "http://127.0.0.1:3001",
      NEXT_PUBLIC_API_URL_WEBSOCKET: "ws://127.0.0.1:3001",
      NEXT_PUBLIC_DISCORD_WEBHOOK_URL: "http://127.0.0.1",
      NEXT_PUBLIC_DISCORD_WEBHOOK_CHEFFIA_ASK: "http://127.0.0.1",
      NEXT_PUBLIC_DISCORD_WEBHOOK_CHEFFIA_WAITLIST: "http://127.0.0.1",
      DATABASE_URL: process.env.E2E_DATABASE_URL ?? "",
      DIRECT_URL: process.env.E2E_DATABASE_URL ?? "",
      TABLE_QR_SIGNING_SECRET: process.env.E2E_TABLE_QR_SIGNING_SECRET ?? "e2e-table-secret",
      NEXT_PUBLIC_SUPABASE_URL: process.env.E2E_SUPABASE_URL ?? "http://127.0.0.1:54321",
      SUPABASE_ANON_KEY: process.env.E2E_SUPABASE_ANON_KEY ?? "ci-placeholder",
    },
  },
})
