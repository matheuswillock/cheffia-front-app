"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type SubscriptionStatus = "loading" | "no_subscription" | "active" | "past_due" | "canceled" | "error"

type SubscriptionData = {
  hasSubscription: boolean
  plan?: string
  status?: string
  cancelAtPeriodEnd?: boolean
  currentPeriodEnd?: string
}

const PLAN_LABELS: Record<string, string> = {
  basic: "Básico",
  pro: "Pro",
  complete: "Completo",
}

const PLANS = [
  { key: "basic", label: "Básico", price: "R$ 99/mês", description: "Para restaurantes que estão começando" },
  { key: "pro", label: "Pro", price: "R$ 149/mês", description: "Para restaurantes em crescimento" },
  { key: "complete", label: "Completo", price: "R$ 249/mês", description: "Para operações completas" },
]

type Props = {
  restaurantSlug: string
  tenantId: string
  restaurantId: string
}

export function SubscriptionManager({ restaurantSlug: _restaurantSlug, tenantId, restaurantId }: Props) {
  const [uiState, setUiState] = useState<SubscriptionStatus>("loading")
  const [data, setData] = useState<SubscriptionData | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (!tenantId || !restaurantId) {
      setUiState("error")
      return
    }

    fetch(`/api/internal/stripe/subscription-status?tenantId=${encodeURIComponent(tenantId)}&restaurantId=${encodeURIComponent(restaurantId)}`)
      .then((r) => r.json())
      .then((body: SubscriptionData) => {
        setData(body)
        if (!body.hasSubscription) {
          setUiState("no_subscription")
        } else if (body.status === "active" || body.status === "past_due") {
          setUiState(body.status as SubscriptionStatus)
        } else {
          setUiState("canceled")
        }
      })
      .catch(() => setUiState("error"))
  }, [tenantId, restaurantId])

  async function callApi(path: string, body: Record<string, unknown>) {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/internal/stripe/${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const json = (await res.json()) as { url?: string }
      if (json.url) window.location.href = json.url
    } finally {
      setActionLoading(false)
    }
  }

  function handleCheckout(plan: string) {
    return callApi("checkout", { plan, billingCycle: "monthly", restaurantId, tenantId })
  }

  function handlePortal() {
    return callApi("portal", { restaurantId, tenantId })
  }

  function handleCancel() {
    return callApi("cancel", { restaurantId, tenantId, immediately: false })
  }

  function handleReactivate() {
    return callApi("reactivate", { restaurantId, tenantId })
  }

  if (uiState === "loading") {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-muted-foreground text-sm">Carregando...</div>
      </div>
    )
  }

  if (uiState === "error") {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Erro ao carregar informações da assinatura.
        </CardContent>
      </Card>
    )
  }

  if (uiState === "no_subscription") {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground text-sm">
          Escolha um plano para ativar seu restaurante.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          {PLANS.map((plan) => (
            <Card key={plan.key}>
              <CardHeader>
                <CardTitle>{plan.label}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-2xl font-bold">{plan.price}</p>
                <Button
                  className="w-full"
                  onClick={() => handleCheckout(plan.key)}
                  disabled={actionLoading}
                >
                  Assinar
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (uiState === "past_due") {
    return (
      <div className="space-y-4">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Pagamento pendente</CardTitle>
            <CardDescription>
              Sua assinatura está com pagamento pendente. Atualize os dados de pagamento para continuar usando o serviço.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handlePortal} disabled={actionLoading}>
              Atualizar pagamento
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (uiState === "canceled") {
    if (data?.cancelAtPeriodEnd) {
      const periodEnd = data.currentPeriodEnd
        ? new Date(data.currentPeriodEnd).toLocaleDateString("pt-BR")
        : null
      return (
        <Card>
          <CardHeader>
            <CardTitle>Assinatura cancelada</CardTitle>
            <CardDescription>
              Sua assinatura foi cancelada{periodEnd ? ` e expira em ${periodEnd}` : ""}. Você pode reativá-la até essa data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleReactivate} disabled={actionLoading}>
              Reativar assinatura
            </Button>
          </CardContent>
        </Card>
      )
    }
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground text-sm">Assinatura encerrada. Escolha um plano para continuar.</p>
        <div className="grid gap-4 sm:grid-cols-3">
          {PLANS.map((plan) => (
            <Card key={plan.key}>
              <CardHeader>
                <CardTitle>{plan.label}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-2xl font-bold">{plan.price}</p>
                <Button
                  className="w-full"
                  onClick={() => handleCheckout(plan.key)}
                  disabled={actionLoading}
                >
                  Assinar
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  // active
  const planLabel = data?.plan ? (PLAN_LABELS[data.plan] ?? data.plan) : "—"
  const periodEnd = data?.currentPeriodEnd
    ? new Date(data.currentPeriodEnd).toLocaleDateString("pt-BR")
    : null

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Plano {planLabel}</CardTitle>
          <CardDescription>
            {periodEnd ? `Renova em ${periodEnd}` : "Assinatura ativa"}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button onClick={handlePortal} disabled={actionLoading}>
            Gerenciar assinatura
          </Button>
          <Button variant="outline" onClick={handleCancel} disabled={actionLoading}>
            Cancelar assinatura
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
