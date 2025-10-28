// Este layout se aplica SOLO a la ruta /login

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Un layout simple que centra el contenido, sin Header ni Nav
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gray-100"> {/* Fondo gris */}
      {children}
    </main>
  );
}
