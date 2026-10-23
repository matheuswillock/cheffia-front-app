export function requireE2EEnvironment(environment, name) {
  const value = environment[name]

  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Missing required E2E environment variable: ${name}`)
  }

  return value
}

export function requireCreatedOrder(value) {
  if (
    typeof value !== "object" ||
    value === null ||
    !("orderId" in value) ||
    typeof value.orderId !== "string" ||
    !("status" in value) ||
    typeof value.status !== "string"
  ) {
    throw new Error("Order creation response does not include orderId and status strings.")
  }

  return value
}

export function assertLocalE2EPrerequisites({
  findCommand = Bun.which,
  canReachDocker = () => Bun.spawnSync(["docker", "info"], { stdout: "ignore", stderr: "ignore" }).exitCode === 0,
} = {}) {
  const missing = ["bun", "supabase", "docker"].filter((command) => !findCommand(command))

  if (missing.length > 0) {
    throw new Error(`Local E2E requires available commands: ${missing.join(", ")}`)
  }

  if (!canReachDocker()) {
    throw new Error("Docker daemon is unavailable; start Docker before running local E2E tests.")
  }
}
