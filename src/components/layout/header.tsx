// src/components/layout/header.tsx

'use client';

import { useAuth } from '@/lib/auth/use-auth';
import { Button } from '@/components/ui/button';
// Asegúrate de instalar: npm install @heroicons/react
import { ArrowRightOnRectangleIcon, UserCircleIcon } from '@heroicons/react/24/outline';

export default function Header() {
  const { user, logout, loading } = useAuth();

  return (
    // Header fijo (sticky), fondo blanco, sombra, padding, no encoge
    // z-10 asegura que esté sobre el contenido al hacer scroll (si es necesario)
    <header className="sticky top-0 z-10 bg-white shadow-sm p-4 flex-shrink-0">
      <div className="flex items-center justify-between max-w-7xl mx-auto w-full"> {/* Centra contenido del header */}
        {/* Espacio izquierdo (vacío según diseño) */}
        <div></div>

        {/* Información del usuario y botón Logout */}
        <div className="flex items-center gap-4">
          {loading ? (
            <div className="h-5 w-24 bg-gray-200 rounded animate-pulse"></div> // Placeholder
          ) : user ? (
            <>
              {/* Muestra el email del usuario */}
              <div className="flex items-center gap-2 text-sm text-gray-700"> {/* Texto un poco más oscuro */}
                <UserCircleIcon className="h-5 w-5 text-gray-500" /> {/* Icono gris */}
                <span>{user.email || 'Usuario'}</span>
              </div>
              {/* Botón Salir */}
              <Button
                variant="ghost" // Sin fondo por defecto
                size="sm" // Tamaño pequeño
                onClick={logout} // Llama a la función logout
                className="text-gray-600 hover:text-red-700 hover:bg-red-50" // Efecto hover rojo
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5 mr-1" />
                Salir
              </Button>
            </>
          ) : (
            // Mensaje si no está logueado
            <span className="text-sm text-gray-500">No autenticado</span>
          )}
        </div>
      </div>
    </header>
  );
}