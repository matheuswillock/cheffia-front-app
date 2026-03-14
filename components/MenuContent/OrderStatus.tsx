"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, CheckCircle2, ChefHat, Package, Truck } from "lucide-react"
import { cn } from "@/lib/utils"
import { useOrderStore } from "@/hooks/useOrderStore"
import { getOrderStatus } from "@/lib/order/mock-order"
import { OrderStatus as OrderStatusType } from "@/models/menuModels/mockedModels"

export default function OrderStatus() {
  const { currentOrderId } = useOrderStore()
  const [status, setStatus] = useState<OrderStatusType | null>(null)
  const [estimatedTime, setEstimatedTime] = useState<number | null>(null)

  useEffect(() => {
    if (!currentOrderId) return

    const fetchStatus = async () => {
      try {
        const orderStatus = await getOrderStatus(currentOrderId)
        setStatus(orderStatus.status)
        setEstimatedTime(orderStatus.estimatedTime)
      } catch (error) {
        console.error("Failed to fetch order status", error)
      }
    }

    fetchStatus()

    // Poll for updates every 30 seconds
    const intervalId = setInterval(fetchStatus, 30000)

    return () => clearInterval(intervalId)
  }, [currentOrderId])

  if (!currentOrderId || !status) return null

  const steps = [
    { id: "received", label: "Order Received", icon: CheckCircle2, status: "completed" },
    { id: "preparing", label: "Preparing", icon: ChefHat, status: getStepStatus("preparing", status) },
    { id: "ready", label: "Ready", icon: Package, status: getStepStatus("ready", status) },
    { id: "delivered", label: "Delivered", icon: Truck, status: getStepStatus("delivered", status) },
  ]

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Order Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Order #{currentOrderId}</span>
            {estimatedTime && <span className="text-sm font-medium">Est. Time: {estimatedTime} min</span>}
          </div>

          <div className="relative">
            {/* Progress line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 z-0" />

            {/* Steps */}
            <div className="relative z-10 space-y-8">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center gap-3">
                  <div
                    className={cn(
                      "h-8 w-8 rounded-full flex items-center justify-center",
                      step.status === "completed"
                        ? "bg-green-100 text-green-600"
                        : step.status === "current"
                          ? "bg-blue-100 text-blue-600"
                          : "bg-gray-100 text-gray-400",
                    )}
                  >
                    <step.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p
                      className={cn(
                        "font-medium",
                        step.status === "completed"
                          ? "text-green-600"
                          : step.status === "current"
                            ? "text-blue-600"
                            : "text-gray-400",
                      )}
                    >
                      {step.label}
                    </p>
                    {step.status === "current" && <p className="text-xs text-gray-500">In progress</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function getStepStatus(step: string, currentStatus: OrderStatusType): "completed" | "current" | "upcoming" {
  const statusOrder = ["received", "preparing", "ready", "delivered"]
  const currentIndex = statusOrder.indexOf(currentStatus)
  const stepIndex = statusOrder.indexOf(step)

  if (stepIndex < currentIndex) return "completed"
  if (stepIndex === currentIndex) return "current"
  return "upcoming"
}

