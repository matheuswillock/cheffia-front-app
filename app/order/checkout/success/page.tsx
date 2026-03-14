import Link from "next/link";
import { CheckCircle2, Clock3, QrCode } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SuccessPageProps {
  searchParams: Promise<{
    customerOrderId?: string;
    paymentPixId?: string;
    status?: string;
  }>;
}

export default async function SuccessPage({ searchParams }: SuccessPageProps) {
  const params = await searchParams;
  const customerOrderId = typeof params.customerOrderId === "string" ? params.customerOrderId : null;
  const paymentPixId = typeof params.paymentPixId === "string" ? params.paymentPixId : null;
  const status = typeof params.status === "string" ? params.status : "Pendente";
  const normalizedStatus = status.trim().toLowerCase();
  const isPaid = normalizedStatus === "paid";

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-4 py-10 md:px-6">
      <Card className="w-full">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            {isPaid ? <CheckCircle2 className="h-8 w-8" /> : <Clock3 className="h-8 w-8" />}
          </div>
          <CardTitle className="text-3xl">
            {isPaid ? "Pagamento PIX confirmado" : "Pagamento PIX em acompanhamento"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          <p className="text-sm text-muted-foreground">
            {isPaid
              ? "O pedido foi reconhecido como pago pelo backend financeiro da Cheffia."
              : "O PIX foi gerado e segue aguardando confirmação do banco pagador. Você pode voltar ao checkout para consultar novamente."}
          </p>

          <div className="rounded-2xl border border-border/70 bg-background/40 p-5 text-left text-sm">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Status</p>
            <p className="mt-2 text-lg font-semibold">{status}</p>
            <p className="mt-4 text-xs uppercase tracking-wide text-muted-foreground">ID do PIX</p>
            <p className="mt-2 break-all font-medium">{paymentPixId ?? "Não informado"}</p>
          </div>

          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href={customerOrderId ? `/order/checkout?customerOrderId=${customerOrderId}` : "/order/checkout"}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 text-sm font-medium text-primary-foreground"
            >
              <QrCode className="h-4 w-4" />
              Voltar ao checkout
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-md border border-border px-4 py-3 text-sm font-medium"
            >
              Ir para a home
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
