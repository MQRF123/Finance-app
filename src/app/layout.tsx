'use client'; // NECESARIO para usar usePathname

import { usePathname } from 'next/navigation';
import './globals.css';
import Header from '@/components/layout/header';
import Nav from '@/components/layout/nav';
import Providers from './providers';

// NO DEBE HABER export const metadata aquí

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Rutas donde NO se mostrará el layout principal (Nav/Header)
  const hideLayoutPaths = ['/', '/login', '/register']; // Asegúrate que '/' esté aquí

  // Determina si mostrar el layout principal basándose en la ruta actual
  const shouldShowLayout = !hideLayoutPaths.some(path => pathname === path);

  // --- DEBUG ---
  // Abre la consola del navegador (F12) para ver estos mensajes
  // console.log("Current Pathname:", pathname);
  // console.log("Should show main layout?", shouldShowLayout);
  // --- FIN DEBUG ---

  return (
    <html lang="es">
      {/* Aplicamos el fondo gris directamente al body si es necesario */}
      <body className={!shouldShowLayout ? 'bg-gray-100' : 'bg-gray-100'}> {/* bg-gray-100 siempre */}
        <Providers>
          {shouldShowLayout ? (
            // --- LAYOUT PRINCIPAL (Dashboard, Simulaciones, etc.) ---
            <div className="flex h-screen overflow-hidden">
              <Nav /> {/* Barra lateral fija */}
              <div className="flex flex-col flex-1 overflow-hidden">
                <Header /> {/* Header fijo */}
                {/* Contenido principal scrollable */}
                <main className="flex-grow p-6 md:p-8 overflow-y-auto">
                  <div className="max-w-7xl mx-auto w-full">{children}</div>
                </main>
              </div>
            </div>
          ) : (
            // --- LAYOUT COMPLETAMENTE VACÍO (Root '/', Login, Register) ---
            // Renderiza SÓLO el contenido (children) sin ninguna estructura adicional aquí.
            // La estructura (como el <main> centrado) debe venir de la página misma
            // o de un layout específico como login/layout.tsx.
            <>{children}</>
          )}
        </Providers>
      </body>
    </html>
  );
}

