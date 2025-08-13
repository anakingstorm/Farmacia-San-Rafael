"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export interface CartItem { productId: string; name: string; priceCents: number; quantity: number; }
interface CartContextValue {
  items: CartItem[];
  add: (item: Omit<CartItem, 'quantity'>, qty?: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
  totalCents: number;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);
const LS_KEY = 'fsr_cart_v1';

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
  }, []);
  useEffect(() => { localStorage.setItem(LS_KEY, JSON.stringify(items)); }, [items]);
  const add: CartContextValue['add'] = (item, qty = 1) => {
    setItems(prev => {
      const existing = prev.find(p => p.productId === item.productId);
      if (existing) return prev.map(p => p.productId === item.productId ? { ...p, quantity: p.quantity + qty } : p);
      return [...prev, { ...item, quantity: qty }];
    });
  };
  const remove = (productId: string) => setItems(prev => prev.filter(p => p.productId !== productId));
  const clear = () => setItems([]);
  const totalCents = items.reduce((s, i) => s + i.priceCents * i.quantity, 0);
  return <CartContext.Provider value={{ items, add, remove, clear, totalCents }}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart debe usarse dentro de CartProvider');
  return ctx;
}
