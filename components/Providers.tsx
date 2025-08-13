"use client";
import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';
import { CartProvider } from '../lib/cart-context';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <CartProvider>{children}</CartProvider>
    </SessionProvider>
  );
}
