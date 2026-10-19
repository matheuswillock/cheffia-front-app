"use client"

import { useState } from "react"

export function TableManager({ restaurantSlug }: { restaurantSlug: string }) {
  const [label, setLabel] = useState("")
  const [created, setCreated] = useState<{ label: string; url: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const createTable = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const response = await fetch(`/api/restaurants/${encodeURIComponent(restaurantSlug)}/tables`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label }),
      })
      const body = (await response.json()) as { label?: string; url?: string; code?: string }
      if (!response.ok || !body.label || !body.url) throw new Error(body.code ?? "TABLE_MANAGEMENT_UNAVAILABLE")
      setCreated({ label: body.label, url: body.url })
      setLabel("")
    } catch {
      setError("Não foi possível criar a mesa.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="mx-auto max-w-xl space-y-6 px-4 py-8" aria-labelledby="table-manager-title">
      <div>
        <h1 id="table-manager-title" className="text-2xl font-bold">Mesas e QR Codes</h1>
        <p className="text-sm text-muted-foreground">Cada mesa recebe um QR assinado e uma sessão independente.</p>
      </div>
      <form className="flex gap-3" onSubmit={createTable}>
        <label className="flex-1">
          <span className="mb-1 block text-sm font-medium">Nome da mesa</span>
          <input
            className="w-full rounded-lg border px-3 py-2"
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            placeholder="Mesa 1"
            required
            maxLength={80}
          />
        </label>
        <button type="submit" className="mt-6 rounded-lg bg-primary px-4 py-2 text-primary-foreground" disabled={saving}>
          {saving ? "Criando…" : "Criar mesa"}
        </button>
      </form>
      {created && (
        <div className="rounded-xl border p-4">
          <p className="font-semibold">{created.label}</p>
          <p className="my-2 break-all text-xs text-muted-foreground">O QR só é emitido nesta resposta.</p>
          <a className="underline" href={created.url} aria-label={`Abrir QR da ${created.label}`}>
            Abrir QR da {created.label}
          </a>
        </div>
      )}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </section>
  )
}
