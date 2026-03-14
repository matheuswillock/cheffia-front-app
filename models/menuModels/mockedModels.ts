export interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  image?: string
  dietary?: string[]
  options?: MenuItemOption[]
}

export interface MenuItemOption {
  name: string
  required: boolean
  multiple: boolean
  choices: MenuItemOptionChoice[]
}

export interface MenuItemOptionChoice {
  id: string
  name: string
  price: number
}

export interface OrderItem {
  id: string
  menuItemId: string
  name: string
  price: number
  quantity: number
  options?: Record<string, string | string[]>
  specialInstructions?: string
  subtotal: number
}

export interface MenuCategory {
  id: string
  name: string
}

export type OrderStatus = "received" | "preparing" | "ready" | "delivered"

export interface OrderStatusResponse {
  orderId: string
  status: OrderStatus
  estimatedTime: number
}

export interface OrderSubmitResponse {
  success: boolean
  orderId: string
}

