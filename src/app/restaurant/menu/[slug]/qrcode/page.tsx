import { Suspense } from "react"
// import QRCodeGenerator from "@/components/qr-code-generator"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import QRCodeGenerator from "@/components/QRCodeContent/QRCodeGenerator"

export default function QRCodeGeneratorPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Table QR Code Generator</h1>
      <p className="text-gray-600 mb-8">
        Generate QR codes for your restaurant tables. Customers can scan these QR codes to access your digital menu.
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Generate QR Codes</CardTitle>
          <CardDescription>
            Enter your restaurant ID and the number of tables to generate QR codes for printing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
            <QRCodeGenerator />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}

