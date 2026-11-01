import { cleanup, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, expect, it, vi } from "vitest"

import { TableManager } from "@/components/Ordering/TableManager"

afterEach(() => { cleanup(); vi.restoreAllMocks() })


it("shows error message when table creation fails", async () => {
  vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
    new Response(JSON.stringify({ code: "TABLE_MANAGEMENT_UNAVAILABLE" }), { status: 503 }),
  )
  const user = userEvent.setup()
  render(<TableManager restaurantSlug="demo" />)
  await user.type(screen.getByLabelText("Nome da mesa"), "Mesa 1")
  await user.click(screen.getByRole("button", { name: "Criar mesa" }))
  await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument())
  expect(screen.getByRole("alert")).toHaveTextContent("Não foi possível criar a mesa")
})

it("disables the submit button while saving", async () => {
  let resolveResponse!: (v: Response) => void
  vi.spyOn(globalThis, "fetch").mockReturnValueOnce(
    new Promise<Response>((resolve) => {
      resolveResponse = resolve
    }),
  )
  const user = userEvent.setup()
  render(<TableManager restaurantSlug="demo" />)
  await user.type(screen.getByLabelText("Nome da mesa"), "Mesa 1")
  await user.click(screen.getByRole("button", { name: "Criar mesa" }))
  expect(screen.getByRole("button", { name: "Criando…" })).toBeDisabled()
  resolveResponse(
    new Response(JSON.stringify({ tableId: "t1", label: "Mesa 1", url: "http://localhost/table/token" }), { status: 201 }),
  )
  await waitFor(() => expect(screen.getByRole("button", { name: "Criar mesa" })).not.toBeDisabled())
})

it("creates a table and exposes its one-time QR destination", async () => {
  const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
    new Response(
      JSON.stringify({ tableId: "table-1", label: "Mesa 1", url: "http://localhost/table/v1.token" }),
      { status: 201 },
    ),
  )
  const user = userEvent.setup()
  render(<TableManager restaurantSlug="demo" />)

  await user.type(screen.getByLabelText("Nome da mesa"), "Mesa 1")
  await user.click(screen.getByRole("button", { name: "Criar mesa" }))

  await waitFor(() => expect(screen.getByRole("link", { name: "Abrir QR da Mesa 1" })).toBeInTheDocument())
  expect(fetchMock).toHaveBeenCalledWith(
    "/api/restaurants/demo/tables",
    expect.objectContaining({ method: "POST" }),
  )
})
