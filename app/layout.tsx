import './globals.css';
import { ReactNode } from 'react';
import { Providers } from '../components/Providers';
import { Navbar } from '../components/Navbar';

export const metadata = {
  title: 'Farmacia San Rafael',
  description: 'Tienda en línea de Farmacia San Rafael'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen flex flex-col">
            <Providers>
              <Navbar />
              <main className="flex-1 container mx-auto p-4 w-full max-w-6xl">{children}</main>
            </Providers>
        <footer className="bg-gray-100 text-center text-xs py-4 text-gray-600">© {new Date().getFullYear()} Farmacia San Rafael</footer>
      </body>
    </html>
  );
}
