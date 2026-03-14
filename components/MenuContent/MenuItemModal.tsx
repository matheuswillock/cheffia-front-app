"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import Image from "next/image"
import { Minus, Plus } from "lucide-react"
import { MenuItem, OrderItem } from "@/models/menuModels/mockedModels"
import { useOrderStore } from "@/hooks/useOrderStore"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog"
import { Checkbox } from "../ui/checkbox"
import { RadioGroup, RadioGroupItem } from "../ui/radio-group"

interface MenuItemModalProps {
  children: React.ReactNode
  item: MenuItem
}

export default function MenuItemModal({ children, item }: MenuItemModalProps) {
  const [open, setOpen] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [specialInstructions, setSpecialInstructions] = useState("")
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string | string[]>>({})
  const addToOrder = useOrderStore((state) => state.addItem)

  const handleAddToOrder = () => {
    const orderItem: OrderItem = {
      id: `${item.id}-${Date.now()}`,
      menuItemId: item.id,
      name: item.name,
      price: item.price,
      quantity,
      options: selectedOptions,
      specialInstructions,
      subtotal: item.price * quantity,
    }

    addToOrder(orderItem)
    setOpen(false)
    resetForm()
  }

  const resetForm = () => {
    setQuantity(1)
    setSpecialInstructions("")
    setSelectedOptions({})
  }

  const handleQuantityChange = (change: number) => {
    const newQuantity = quantity + change
    if (newQuantity >= 1) {
      setQuantity(newQuantity)
    }
  }

  const handleOptionChange = (category: string, value: string, isMultiple: boolean) => {
    setSelectedOptions((prev) => {
      if (isMultiple) {
        const currentValues = Array.isArray(prev[category]) ? (prev[category] as string[]) : []
        if (currentValues.includes(value)) {
          return {
            ...prev,
            [category]: currentValues.filter((v) => v !== value),
          }
        } else {
          return {
            ...prev,
            [category]: [...currentValues, value],
          }
        }
      } else {
        return {
          ...prev,
          [category]: value,
        }
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {item.image && (
            <div className="relative h-48 w-full rounded-md overflow-hidden">
              <Image src={item.image || "/placeholder.svg"} alt={item.name} fill className="object-cover" />
            </div>
          )}

          <div>
            <p className="text-gray-600">{item.description}</p>
            <p className="text-lg font-bold mt-2">${item.price.toFixed(2)}</p>
          </div>

          {/* Quantity selector */}
          <div>
            <h3 className="text-sm font-medium mb-2">Quantity</h3>
            <div className="flex items-center">
              <Button variant="outline" size="icon" onClick={() => handleQuantityChange(-1)} disabled={quantity <= 1}>
                <Minus className="h-4 w-4" />
              </Button>
              <span className="mx-4 w-8 text-center">{quantity}</span>
              <Button variant="outline" size="icon" onClick={() => handleQuantityChange(1)}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Options - Single select */}
          {item.options?.map((option) => (
            <div key={option.name}>
              <h3 className="text-sm font-medium mb-2">{option.name}</h3>
              {option.required && <p className="text-xs text-red-500 mb-2">Required</p>}

              {option.multiple ? (
                <div className="space-y-2">
                  {option.choices.map((choice) => (
                    <div key={choice.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={choice.id}
                        checked={
                          Array.isArray(selectedOptions[option.name]) &&
                          (selectedOptions[option.name] as string[]).includes(choice.id)
                        }
                        onCheckedChange={(checked) => {
                          if (checked) {
                            handleOptionChange(option.name, choice.id, true)
                          } else {
                            handleOptionChange(option.name, choice.id, true)
                          }
                        }}
                      />
                      <Label htmlFor={choice.id} className="flex justify-between w-full">
                        <span>{choice.name}</span>
                        {choice.price > 0 && <span className="text-gray-500">+${choice.price.toFixed(2)}</span>}
                      </Label>
                    </div>
                  ))}
                </div>
              ) : (
                <RadioGroup
                  value={selectedOptions[option.name] as string}
                  onValueChange={(value) => handleOptionChange(option.name, value, false)}
                >
                  {option.choices.map((choice) => (
                    <div key={choice.id} className="flex items-center space-x-2">
                      <RadioGroupItem value={choice.id} id={choice.id} />
                      <Label htmlFor={choice.id} className="flex justify-between w-full">
                        <span>{choice.name}</span>
                        {choice.price > 0 && <span className="text-gray-500">+${choice.price.toFixed(2)}</span>}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}
            </div>
          ))}

          {/* Special instructions */}
          <div>
            <Label htmlFor="instructions">Special Instructions</Label>
            <Textarea
              id="instructions"
              placeholder="Any special requests or allergies?"
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              className="mt-1"
            />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleAddToOrder} className="w-full">
            Add to Order - ${(item.price * quantity).toFixed(2)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

