"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Home, Calculator, History, Settings, HelpCircle, LogOut } from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/simulaciones/nueva", label: "Simulaciones", icon: Calculator },
  { href: "/simulaciones/list", label: "Historial", icon: History },
  { href: "/settings", label: "Configuración", icon: Settings },
  { href: "/help", label: "Ayuda", icon: HelpCircle },
];

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();

  if (loading) return <div className="p-6">Cargando…</div>;
  if (!user) { if (typeof window !== "undefined") window.location.href = "/login"; return null; }

  return (
    <div className="min-h-dvh bg-emerald-100 p-6">
      {/* Contenedor centrado, layout en fila */}
      <div className="mx-auto max-w-6xl flex gap-6 items-stretch">
        {/* === SIDEBAR IZQUIERDO FIJO === */}
        <aside
          className="
            w-[240px] shrink-0 rounded-2xl bg-emerald-800 text-white p-4
            sticky top-6 h-[calc(100vh-3rem)] overflow-auto
          "
        >
          <div className="px-2 py-3 text-lg font-semibold">MiVivienda</div>
          <nav className="mt-2 space-y-1">
            {NAV.map(({ href, label, icon: Icon }) => {
              const active = pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md
                    ${active ? "bg-emerald-700" : "hover:bg-emerald-700"}`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-sm">{label}</span>
                </Link>
              );
            })}
            <button
              onClick={() => signOut(auth)}
              className="mt-2 flex items-center gap-2 px-3 py-2 rounded-md hover:bg-emerald-700 w-full"
            >
              <LogOut className="h-4 w-4" />
              <span className="text-sm">Salir</span>
            </button>
          </nav>
        </aside>

        {/* === CONTENIDO A LA DERECHA (CARD BLANCA) === */}
        <main className="flex-1 rounded-2xl bg-white border shadow-sm p-5">
          {children}
        </main>
      </div>
    </div>
  );
}
