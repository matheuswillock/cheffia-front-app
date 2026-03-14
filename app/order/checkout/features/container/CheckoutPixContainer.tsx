"use client";

import { Copy, Loader2, QrCode, RefreshCcw } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useCheckoutPix } from "@/app/order/checkout/features/context/CheckoutPixContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

const formatCurrency = (valueInCents: number): string =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format((valueInCents || 0) / 100);

const formatDateTime = (value: string | null): string => {
  if (!value) return "Sem expiração informada";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
};

export function CheckoutPixContainer() {
  const {
    customerOrderId,
    form,
    charge,
    isSubmitting,
    isPolling,
    errorMessage,
    infoMessage,
    confirmationStatus,
    copyFeedback,
    setField,
    submitCharge,
    confirmNow,
    copyPixCode,
  } = useCheckoutPix();

  const pixCode = charge?.copyPasteCode ?? charge?.qrCode ?? "";
  const qrValue = charge?.copyPasteCode ?? charge?.qrCode ?? charge?.id ?? "cheffia-pix";

  if (!customerOrderId) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-5xl items-center px-4 py-10 md:px-6">
        <Card className="w-full border-destructive/40 bg-card">
          <CardHeader>
            <CardTitle>Checkout PIX indisponível</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            A URL precisa receber `customerOrderId` por query string para gerar a cobrança.
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 py-8 md:px-6 lg:flex-row lg:items-start">
      <Card className="w-full lg:max-w-xl">
        <CardHeader className="space-y-2">
          <p className="text-xs uppercase tracking-[0.32em] text-muted-foreground">Checkout Pix</p>
          <CardTitle className="text-3xl">Pague o pedido com QR Code</CardTitle>
          <p className="text-sm text-muted-foreground">
            Informe os dados do pagador final. O restaurante não é mais usado como pagador da cobrança.
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="payer-name">Nome do pagador</Label>
              <Input
                id="payer-name"
                value={form.name}
                onChange={(event) => setField("name", event.target.value)}
                placeholder="Nome completo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payer-phone">Telefone</Label>
              <Input
                id="payer-phone"
                value={form.phoneNumber}
                onChange={(event) => setField("phoneNumber", event.target.value)}
                placeholder="11999999999"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payer-document">CPF ou CNPJ</Label>
              <Input
                id="payer-document"
                value={form.document}
                onChange={(event) => setField("document", event.target.value)}
                placeholder="Opcional"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="payer-email">E-mail</Label>
              <Input
                id="payer-email"
                type="email"
                value={form.email}
                onChange={(event) => setField("email", event.target.value)}
                placeholder="Opcional"
              />
            </div>
          </div>

          <label className="flex items-start gap-3 rounded-xl border border-border/70 bg-background/40 p-4 text-sm">
            <Checkbox
              checked={form.payTip}
              onCheckedChange={(checked) => setField("payTip", checked === true)}
            />
            <span>
              Adicionar gorjeta automática de 10% ao pedido.
            </span>
          </label>

          {infoMessage ? (
            <div className="rounded-xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-foreground">
              {infoMessage}
            </div>
          ) : null}

          {errorMessage ? (
            <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {errorMessage}
            </div>
          ) : null}

          <Button
            type="button"
            className="w-full"
            disabled={isSubmitting || isPolling}
            onClick={() => void submitCharge()}
          >
            {isSubmitting ? <Loader2 className="animate-spin" /> : <QrCode />}
            {isSubmitting ? "Gerando PIX..." : "Gerar cobrança PIX"}
          </Button>
        </CardContent>
      </Card>

      <Card className="w-full">
        <CardHeader className="space-y-2">
          <CardTitle>QR Code e status</CardTitle>
          <p className="text-sm text-muted-foreground">
            Após gerar o PIX, o sistema faz polling curto para detectar a confirmação do pagamento.
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          {!charge ? (
            <div className="space-y-3">
              <Skeleton className="h-56 w-full rounded-2xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-24 w-full rounded-xl" />
            </div>
          ) : (
            <>
              <div className="grid gap-4 xl:grid-cols-[280px,1fr]">
                <div className="flex flex-col items-center gap-4 rounded-2xl border border-border/70 bg-background/40 p-5">
                  <div className="rounded-2xl bg-white p-4">
                    <QRCodeSVG value={qrValue} size={220} includeMargin />
                  </div>
                  <p className="text-center text-xs text-muted-foreground">
                    ID da cobrança: {charge.id}
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-xl border border-border/70 bg-background/40 p-4">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Valor</p>
                      <p className="mt-2 text-2xl font-semibold">{formatCurrency(charge.amount)}</p>
                    </div>
                    <div className="rounded-xl border border-border/70 bg-background/40 p-4">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Status</p>
                      <p className="mt-2 text-2xl font-semibold">{confirmationStatus ?? charge.status}</p>
                    </div>
                    <div className="rounded-xl border border-border/70 bg-background/40 p-4">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Expira em</p>
                      <p className="mt-2 font-semibold">{formatDateTime(charge.expiresAt)}</p>
                    </div>
                    <div className="rounded-xl border border-border/70 bg-background/40 p-4">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Taxa de plataforma</p>
                      <p className="mt-2 font-semibold">{formatCurrency(charge.platformFee)}</p>
                    </div>
                  </div>

                  <div className="space-y-2 rounded-xl border border-border/70 bg-background/40 p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Copia e cola</p>
                    <div className="rounded-lg bg-background px-3 py-3 text-sm break-all">
                      {pixCode || "O Asaas ainda não devolveu o código copia e cola."}
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <Button type="button" variant="outline" onClick={() => void copyPixCode()} disabled={!pixCode}>
                        <Copy />
                        Copiar código
                      </Button>
                      <Button type="button" variant="outline" onClick={() => void confirmNow()} disabled={isPolling}>
                        {isPolling ? <Loader2 className="animate-spin" /> : <RefreshCcw />}
                        {isPolling ? "Consultando..." : "Consultar agora"}
                      </Button>
                    </div>
                    {copyFeedback ? <p className="text-xs text-muted-foreground">{copyFeedback}</p> : null}
                  </div>

                  <div className="rounded-xl border border-border/70 bg-background/40 p-4 text-sm text-muted-foreground">
                    {charge.description}
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
