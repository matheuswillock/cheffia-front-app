"use client"

import { useState, useRef, useEffect } from "react"
import { QRCodeSVG } from "qrcode.react"
import { useReactToPrint } from "react-to-print"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Download, Printer, Eye, Grid2X2, Grid3X3 } from "lucide-react"
import { toast } from "sonner"
import jszip from "jszip"

interface QRCodeGeneratorProps {
  restaurantId: string
}

// TODO: verificar a session do usuário
export default function QRCodeGenerator({restaurantId} : QRCodeGeneratorProps) {
  const [tableCount, setTableCount] = useState(10)
  const [qrSize, setQrSize] = useState(150)
  const [layout, setLayout] = useState<"2x2" | "3x3">("2x2")
  const [showPreview, setShowPreview] = useState(true)
  const printRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Draw QR codes on canvas after component mounts
    Array.from({ length: tableCount }, (_, i) => {
      const tableNumber = i + 1
      const svg = document.getElementById(`qr-svg-${tableNumber}`) as unknown as SVGElement
      const canvas = document.getElementById(`qr-canvas-${tableNumber}`) as HTMLCanvasElement
      if (svg && canvas) {
        const svgData = new XMLSerializer().serializeToString(svg)
        const img = new Image()
        img.src = `data:image/svg+xml;base64,${btoa(svgData)}`
        img.onload = () => {
          const ctx = canvas.getContext("2d")
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            ctx.drawImage(img, 0, 0)
          }
        }
      }
    })
  }, [restaurantId, tableCount, qrSize, layout])

  const handlePrint = useReactToPrint({
    print: () => Promise.resolve(printRef.current),
    documentTitle: `QR Codes - ${restaurantId}`,
    onAfterPrint: () => {
      toast("Print job sent", {
        description: "Your QR codes have been sent to the printer."
      })
    },
  })

  const downloadQRCode = (tableNumber: number) => {
    const canvas = document.getElementById(`qr-canvas-${tableNumber}`) as HTMLCanvasElement
    if (!canvas) return

    const url = canvas.toDataURL("image/png")
    const link = document.createElement("a")
    link.href = url
    link.download = `qr-table-${tableNumber}-${restaurantId}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const downloadAllQRCodes = async () => {

    // Create a zip file with JSZip
    const zip = new jszip()

    // Add each QR code to the zip
    const promises = Array.from({ length: tableCount }, async (_, i) => {
      const tableNumber = i + 1
      const canvas = document.getElementById(`qr-canvas-${tableNumber}`) as HTMLCanvasElement
      if (!canvas) return

      const url = canvas.toDataURL("image/png")
      // Convert data URL to blob
      const res = await fetch(url)
      const blob = await res.blob()
      zip.file(`qr-table-${tableNumber}-${restaurantId}.png`, blob)
    })

    // Generate the zip file when all QR codes are added
    await Promise.all(promises)
    const content = await zip.generateAsync({ type: "blob" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(content)
    link.download = `qr-codes-${restaurantId}.zip`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast("Download complete", {
      description: `${tableCount} QR codes have been downloaded as a zip file.`,
    })
  }

  const generateQRUrl = (tableNumber: number) => {
    return `/restaurant/menu/${restaurantId}?table=${tableNumber}`
  }

  const renderQRCodes = () => {
    return (
      <div className={`grid ${layout === "2x2" ? "grid-cols-2" : "grid-cols-3"} gap-6`}>
        {Array.from({ length: tableCount }, (_, i) => {
          const tableNumber = i + 1
          return (
            <div key={tableNumber} className="flex flex-col items-center p-4 border rounded-lg">
              <div className="text-sm text-gray-500 mb-2">Table {tableNumber}</div>
              <QRCodeSVG
                id={`qr-svg-${tableNumber}`}
                value={generateQRUrl(tableNumber)}
                size={qrSize}
                level="H"
                includeMargin
              />
              <canvas id={`qr-canvas-${tableNumber}`} className="hidden" width={qrSize} height={qrSize} />
              <div className="text-xs text-center mt-2 text-gray-600 break-all">{generateQRUrl(tableNumber)}</div>
              <Button variant="outline" size="sm" className="mt-2 rounded-xl hover:bg-button hover:text-foreground-default" onClick={() => downloadQRCode(tableNumber)}>
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="table-count">Number of Tables</Label>
              <span className="text-sm text-gray-500">{tableCount} tables</span>
            </div>
            <div className="flex items-center gap-2">
              <Slider
                id="table-count"
                min={1}
                max={50}
                step={1}
                value={[tableCount]}
                onValueChange={(value) => setTableCount(value[0])}
              />
              <Input
                type="number"
                min={1}
                max={50}
                value={tableCount}
                onChange={(e) => setTableCount(Number(e.target.value))}
                className="w-20"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Print Layout</Label>
            <div className="flex gap-4">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={layout === "2x2" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setLayout("2x2")}
                      className="rounded-xl"
                    >
                      <Grid2X2 className="h-4 w-4 mr-1" />
                      2×2 Grid
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>4 QR codes por página</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={layout === "3x3" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setLayout("3x3")}
                      className="rounded-xl"
                    >
                      <Grid3X3 className="h-4 w-4 mr-1" />
                      3×3 Grid
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>9 QR codes por página</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="qr-size">QR Code Size</Label>
              <span className="text-sm text-gray-500">{qrSize}px</span>
            </div>
            <div className="flex items-center gap-2">
              <Slider
                id="qr-size"
                min={100}
                max={300}
                step={10}
                value={[qrSize]}
                onValueChange={(value) => setQrSize(value[0])}
              />
              <Input
                type="number"
                min={100}
                max={300}
                step={10}
                value={qrSize}
                onChange={(e) => setQrSize(Number(e.target.value))}
                className="w-20"
              />
            </div>
          </div>

        </div>
      </div>

      <div className="flex flex-wrap gap-3 justify-between items-center">
        <div className="flex gap-3">
          <Button onClick={() => handlePrint()} className="rounded-xl hover:bg-button hover:text-foreground-default font-semibold">
            <Printer className="h-4 w-4 mr-2" />
            Imprimir 
          </Button>

          <Button variant="outline" onClick={downloadAllQRCodes} className="rounded-xl font-semibold hover:bg-button hover:text-foreground-default">
            <Download className="h-4 w-4 mr-2" />
            Baixar todos
          </Button>
        </div>

        <div className="flex items-center">
          <Button variant="ghost" size="sm" onClick={() => setShowPreview(!showPreview)} className="rounded-xl font-semibold hover:bg-button">
            <Eye className="h-4 w-4 mr-1" />
            {showPreview ? "Esconder Pré-visualização" : "Mostrar Pré-visualização"}
          </Button>
        </div>
      </div>

      {showPreview && (
        <div className="mt-6 border rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium">Preview</h3>
            <div className="text-sm text-gray-500">
              {tableCount} QR codes • {layout === "2x2" ? "4" : "9"} por página
            </div>
          </div>

          <div className="overflow-auto max-h-[600px]">{renderQRCodes()}</div>
        </div>
      )}

      {/* Hidden div for printing */}
      <div className="hidden">
        <div ref={printRef} className="p-8">
          <div className={`grid ${layout === "2x2" ? "grid-cols-2" : "grid-cols-3"} gap-8`}>
            { Array.from({ length: tableCount }, (_, i) => {
              const tableNumber = i + 1
              return (
                <div key={tableNumber} className="flex flex-col items-center p-4 border rounded-lg">
                  <div className="text-lg font-bold mb-1">Table {tableNumber}</div>
                  <QRCodeSVG
                    value={generateQRUrl(tableNumber)}
                    size={layout === "2x2" ? 200 : 150}
                    level="H"
                  />
                  <div className="text-sm mt-2 text-center">Scan to view our menu</div>
                  <div className="text-xs mt-1 text-gray-500">{restaurantId}</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}