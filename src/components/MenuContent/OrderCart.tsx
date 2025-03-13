"use client"

import { useState } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ShoppingCart, Trash2, ChevronUp, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { useOrderStore } from "@/hooks/useOrderStore"
import { submitOrder } from "@/services/restaurant/order/orderBusiness"
import { OrderItem } from "@/models/menuModels/mockedModels"
import { toast } from "sonner"

export default function OrderCart() {
  const { items, removeItem, clearItems, totalAmount } = useOrderStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isExpanded, setIsExpanded] = useState(true)

  const handleSubmitOrder = async () => {
    if (items.length === 0) {
      toast("Cart is empty",{
        description: "Please add items to your order",
        action: {
          label: "Fechar",
          onClick: () => console.log("Fechar"),
        },
      })
      return
    }

    setIsSubmitting(true)
    try {
      const result = await submitOrder(items)
      toast("Order submitted successfully!",{
        description: `Your order #${result.orderId} has been sent to the kitchen.`,
        action: {
          label: "Fechar",
          onClick: () => console.log("Fechar"),
        },
      })
      clearItems()
    } catch (error) {
      toast("Failed to submit order", {
        description: "Please try again later",
        action: {
          label: "Fechar",
          onClick: () => console.log("Fechar"),
        },
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleExpanded = () => setIsExpanded(!isExpanded)

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Your Order
            {items.length > 0 && <Badge variant="secondary">{items.length}</Badge>}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={toggleExpanded} className="h-8 w-8 p-0">
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>

      <div
        className={cn(
          "transition-all duration-300 overflow-hidden",
          isExpanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0",
        )}
      >
        <CardContent className="pb-3">
          {items.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <p>Your cart is empty</p>
              <p className="text-sm mt-1">Add items from the menu to get started</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
              {items.map((item) => (
                <OrderItemCard key={item.id} item={item} onRemove={() => removeItem(item.id)} />
              ))}
            </div>
          )}
        </CardContent>

        {items.length > 0 && (
          <>
            <Separator />
            <CardContent className="pt-3">
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span>${totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Tax</span>
                  <span>${(totalAmount * 0.08).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold pt-1.5">
                  <span>Total</span>
                  <span>${(totalAmount * 1.08).toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </>
        )}
      </div>

      <CardFooter className="pt-3">
        <div className="w-full space-y-2">
          <Button className="w-full rounded-xl" onClick={handleSubmitOrder} disabled={items.length === 0 || isSubmitting}>
            {isSubmitting ? "Processing..." : "Place Order"}
          </Button>

          {items.length > 0 && (
            <Button variant="outline" size="sm" className="w-full" onClick={() => clearItems()}>
              Clear Cart
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}

function OrderItemCard({ item, onRemove }: { item: OrderItem; onRemove: () => void }) {
  return (
    <div className="flex justify-between items-start gap-2">
      <div className="flex-1">
        <div className="flex justify-between">
          <span className="font-medium">
            {item.quantity} × {item.name}
          </span>
          <span className="font-medium">${item.subtotal.toFixed(2)}</span>
        </div>

        {Object.entries(item.options || {}).map(([category, value]) => (
          <div key={category} className="text-xs text-gray-500 mt-0.5">
            <span className="font-medium">{category}:</span> {Array.isArray(value) ? value.join(", ") : value}
          </div>
        ))}

        {item.specialInstructions && (
          <div className="text-xs text-gray-500 mt-0.5 italic">"{item.specialInstructions}"</div>
        )}
      </div>

      <Button variant="ghost" size="icon" onClick={onRemove} className="h-6 w-6">
        <Trash2 className="h-4 w-4 text-gray-500" />
      </Button>
    </div>
  )
}

