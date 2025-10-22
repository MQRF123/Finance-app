"use client";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { Home, Calculator, History, Settings, HelpCircle, LogOut } from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/simulaciones/nueva", label: "Simulaciones", icon: Calculator },
  { href: "/simulaciones/list", label: "Historial", icon: History },
  { href: "/settings", label: "Configuración", icon: Settings },
  { href: "/help", label: "Ayuda", icon: HelpCircle },
];

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-6">Cargando…</div>;
  if (!user) { if (typeof window !== "undefined") window.location.href = "/login"; return null; }

  return (
    <div className="min-h-dvh grid md:grid-cols-[260px,1fr] bg-emerald-100">
      <aside className="bg-emerald-800 text-white">
        <div className="px-5 py-4 text-lg font-semibold">MiVivienda</div>
        <nav className="px-2 space-y-1">
          {nav.map((n) => {
            const Icon = n.icon;
            return (
              <Link key={n.href} href={n.href} className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-emerald-700">
                <Icon className="h-4 w-4" /> <span>{n.label}</span>
              </Link>
            );
          })}
          <button
            onClick={() => signOut(auth)}
            className="mt-2 flex items-center gap-2 px-3 py-2 rounded-md hover:bg-emerald-700 w-full"
          >
            <LogOut className="h-4 w-4" /> <span>Salir</span>
          </button>
        </nav>
      </aside>

      <main className="p-6">
        <div className="mx-auto max-w-6xl">
          {children}
        </div>
      </main>
    </div>
  );
}
