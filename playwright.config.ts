import { defineConfig, devices, type ReporterDescription } from "@playwright/test"

const baseURL = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3100"
const port = new URL(baseURL).port || "3100"
const reporters: ReporterDescription[] = []

if (process.env.PLAYWRIGHT_JSON_REPORT) {
  reporters.push(["json", { outputFile: process.env.PLAYWRIGHT_JSON_REPORT }])
}
reporters.push(process.env.CI ? ["github"] : ["list"])
if (process.env.CI) {
  reporters.push(["html", { outputFolder: "playwright-report", open: "never" }])
}

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: reporters,
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
    command: `bun run next dev -p ${port}`,
    url: baseURL,
    reuseExistingServer: false,
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
      SUPABASE_JWT_SECRET: process.env.E2E_SUPABASE_JWT_SECRET ?? "",
      NEXT_PUBLIC_SUPABASE_URL: process.env.E2E_SUPABASE_URL ?? "http://127.0.0.1:54321",
      SUPABASE_ANON_KEY: process.env.E2E_SUPABASE_ANON_KEY ?? "ci-placeholder",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.E2E_SUPABASE_ANON_KEY ?? "ci-placeholder",
      SUPABASE_SECRET_KEY: process.env.E2E_SUPABASE_SECRET_KEY ?? "",
      CRON_SECRET: process.env.E2E_CRON_SECRET ?? "e2e-cron-secret",
    },
  },
})
