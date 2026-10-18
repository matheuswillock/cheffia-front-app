import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "bunx next dev --turbopack",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
      SUPABASE_ANON_KEY: "ci-placeholder",
      STRIPE_PUBLISHABLE_KEY: "pk_test_ci_placeholder",
      STRIPE_SECRET_KEY: "sk_test_ci_placeholder",
      NEXT_PUBLIC_API_URL: "http://127.0.0.1:3001",
      NEXT_PUBLIC_API_URL_WEBSOCKET: "ws://127.0.0.1:3001",
      NEXT_PUBLIC_DISCORD_WEBHOOK_URL: "http://127.0.0.1",
      NEXT_PUBLIC_DISCORD_WEBHOOK_CHEFFIA_ASK: "http://127.0.0.1",
      NEXT_PUBLIC_DISCORD_WEBHOOK_CHEFFIA_WAITLIST: "http://127.0.0.1",
    },
  },
})
