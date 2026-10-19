import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, expect, it, vi } from "vitest"

import { TableManager } from "@/components/Ordering/TableManager"

afterEach(() => vi.restoreAllMocks())

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
