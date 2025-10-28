'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth/use-auth';

export default function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/dashboard" className="font-bold text-xl text-emerald-700">
              Finanzas
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <span className="text-sm text-neutral-600">{user.email}</span>
                <button
                  onClick={logout}
                  className="text-sm font-medium text-neutral-600 hover:text-emerald-700"
                >
                  Cerrar sesión
                </button>
              </>
            ) : (
              <Link href="/login" className="text-sm font-medium text-neutral-600 hover:text-emerald-700">
                Iniciar sesión
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
