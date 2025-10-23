"use client";

import Link from "next/link";

export default function SimulacionesPage() {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Simulaciones</h1>
        <Link
          href="/simulaciones/nueva"
          className="rounded-lg bg-emerald-700 text-white px-3 py-2 text-sm hover:bg-emerald-800"
        >
          Nueva simulación
        </Link>
      </div>

      <div className="rounded-2xl border bg-white p-6 text-sm text-neutral-600">
        Aquí irá el listado. Por ahora, usa el botón “Nueva simulación”.
      </div>
    </section>
  );
}
