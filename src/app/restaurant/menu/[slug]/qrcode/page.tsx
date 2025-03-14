"use client"

import { Suspense } from "react"
// import QRCodeGenerator from "@/components/qr-code-generator"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import QRCodeGenerator from "@/components/QRCodeContent/QRCodeGenerator"
import { useParams } from "next/navigation";

// TODO: ADD o o validateSession() para validar a sessão do usuário
export default function QRCodeGeneratorPage() {
  const {slug} = useParams();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Gerador de QR Codes para Mesas</h1>
      <p className="text-gray-600 mb-8">
        Gere QR Codes para as mesas do seu restaurante. Os clientes podem escanear esses códigos QR para acessar seu menu digital.
      </p>

      <Card>
        <CardHeader>
            <CardTitle>Gerar QR Codes</CardTitle>
            <CardDescription>
            Insira o número de mesas para gerar QR Codes para impressão.
            </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
            <QRCodeGenerator 
              restaurantId={slug as string}
            />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}

