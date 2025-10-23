'use client';

// Importa aquí tus providers reales (Auth, Theme, Query, etc).
// Asegúrate que ninguno use window en top-level; usa useEffect si hace falta.

// import { AuthProvider } from '@/context/auth-context';

export default function Providers({ children }: { children: React.ReactNode }) {
  // return <AuthProvider>{children}</AuthProvider>;
  return <>{children}</>;
}
