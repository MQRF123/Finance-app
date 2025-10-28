import './globals.css';
import type { Metadata } from 'next';
import Providers from './providers';

export const metadata: Metadata = {
  title: 'MiVivienda',
  description: 'Simulador MiVivienda',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      {/* Fondo gris claro */}
      <body className="bg-gray-100">
        <Providers>
          {/* Renderiza directamente children. El layout específico (Protected o simple) se encargará de la estructura */}
          {children}
        </Providers>
      </body>
    </html>
  );
}