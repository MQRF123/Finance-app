// src/app/simulaciones/layout.tsx
import ProtectedLayout from '@/components/layout/ProtectedLayout'; // Importa el nuevo layout
import RequireAuth from '@/components/auth/RequireAuth'; // Mantenemos la protección de autenticación

export default function SimulacionesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireAuth>
      {/* Envuelve el contenido con ProtectedLayout */}
      <ProtectedLayout>{children}</ProtectedLayout>
    </RequireAuth>
  );
}