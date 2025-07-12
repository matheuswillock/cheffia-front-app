
import { useState, useEffect } from "react";
import { MenuLiveItemOutput } from "@/models/dtos/output/MenuLive/MenuLiveItemOutput";
import { CartItem } from "./CartItem";

export function useCart() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [totalPrice, setTotalPrice] = useState<number>(0);

  useEffect(() => {
    const stored = localStorage.getItem("cheffia_cart");
    if (stored) {
      const parsed = JSON.parse(stored);
      setCart(parsed);
      const total = parsed.reduce((acc: number, item: CartItem) => acc + item.price * item.quantity, 0);
      setTotalPrice(total);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("cheffia_cart", JSON.stringify(cart));
    const total = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
    setTotalPrice(total);
  }, [cart]);

  const addToCart = (item: MenuLiveItemOutput, quantity: number, comments: string | null) => {
    const existing = cart.find((i) => i.id === item.id);
    if (existing) {
      const updated = cart.map((i) =>
        i.id === item.id ? {
          ...i, quantity: i.quantity + quantity, comments
        } : i
      );
      setCart(updated);
      return;
    }

    setCart([...cart, CartItem.FromMenuLiveItem(item, quantity, comments, null)]);
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem("cheffia_cart");
  };

  const removeItem = (id: string) => {
    const updated = cart.filter((item) => item.id !== id);
    setCart(updated);
  };

  const incrementItem = (id: string) => {
    const updated = cart.map((item) =>
      item.id === id ? { ...item, quantity: item.quantity + 1 } : item
    );
    setCart(updated);
  };

  const decrementItem = (id: string) => {
    const updated = cart.map((item) =>
      item.id === id ? { ...item, quantity: item.quantity - 1 } : item
    );
    setCart(updated);
  };

  return {
    cart,
    totalPrice,
    addToCart,
    clearCart,
    removeItem,
    incrementItem,
    decrementItem
  };
}
