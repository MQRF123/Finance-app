// src/components/layout/ProtectedLayout.tsx
'use client'; // Necesario si Nav o Header usan hooks, o para interactividad futura

import Header from '@/components/layout/header';
import Nav from '@/components/layout/nav';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    // Recreamos la estructura Flex aquí, pero solo para rutas protegidas
    <div className="flex h-screen overflow-hidden">
      <Nav /> {/* Sidebar SIEMPRE presente en este layout */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header /> {/* Header SIEMPRE presente en este layout */}
        {/* Contenido principal scrollable */}
        <main className="flex-grow p-6 md:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}