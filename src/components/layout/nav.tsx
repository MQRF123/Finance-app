// src/components/layout/nav.tsx

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
// Asegúrate de instalar: npm install @heroicons/react
import { HomeIcon, CalculatorIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils/cn'; // O tu utilidad para clases

const links = [
  { href: '/dashboard', label: 'Dashboard', icon: HomeIcon },
  { href: '/simulaciones', label: 'Simulaciones', icon: CalculatorIcon },
];

export default function Nav() {
  const pathname = usePathname();

  // Color verde oscuro (ajusta si es necesario, ej. green-800, teal-800)
  const sidebarBgColor = 'bg-green-800'; // Puedes cambiarlo fácilmente aquí
  const activeLinkBgColor = 'bg-green-700'; // Color para el link activo
  const hoverLinkBgColor = 'hover:bg-green-700'; // Color para hover

  return (
    // Ancho fijo, no encoge, color de fondo, texto blanco, layout flex vertical, altura pantalla, fijo
    <aside className={`w-60 flex-shrink-0 ${sidebarBgColor} text-white p-4 flex flex-col h-screen sticky top-0`}>
      {/* Logo MiVivienda */}
      <div className="mb-8 pt-4">
        <div className="text-2xl font-bold text-center text-white">
          MiVivienda
        </div>
        {/* Nombre "Juan Pérez" ELIMINADO */}
      </div>

      {/* Navegación */}
      <nav className="flex-grow">
        <ul className="space-y-2">
          {links.map((link) => {
            const isActive =
              link.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname.startsWith(link.href);

            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? `${activeLinkBgColor} text-white shadow-inner` // Estilo activo
                      : `text-green-100 ${hoverLinkBgColor} hover:text-white` // Estilo inactivo
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <link.icon className="h-5 w-5 flex-shrink-0" />
                  <span>{link.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      {/* Espacio reservado al final */}
      <div className="mt-auto"></div>
    </aside>
  );
}