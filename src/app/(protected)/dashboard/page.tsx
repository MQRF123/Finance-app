"use client";

import { useMemo } from "react";

type KPI = { label: string; value: string; hint?: string };
type Activity = { id: string; title: string; meta: string };

export default function DashboardPage() {
  const kpis: KPI[] = useMemo(
    () => [
      { label: "Simulaciones", value: "12" },
      { label: "TCEA promedio", value: "13.25%" },
      { label: "Monto simulado", value: "S/ 1,250,000", hint: "Últimos 30 días" },
    ],
    []
  );

  const recent: Activity[] = useMemo(
    () => [
      { id: "1", title: "Simulación #A92F3B", meta: "TCEA 12.9% · 240m" },
      { id: "2", title: "Simulación #C781DD", meta: "TCEA 13.4% · 180m" },
    ],
    []
  );

  return (
    <section className="space-y-6">
      <h1 className="text-xl font-semibold">Dashboard</h1>

      {/* KPIs */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-2xl border bg-white p-4">
            <div className="text-sm text-neutral-600">{k.label}</div>
            <div className="text-2xl font-bold mt-1">{k.value}</div>
            {k.hint && <div className="text-xs text-neutral-500 mt-1">{k.hint}</div>}
          </div>
        ))}
      </div>

      {/* Actividad reciente */}
      <div className="rounded-2xl border bg-white p-4">
        <div className="font-medium mb-2">Actividad reciente</div>
        <ul className="space-y-2">
          {recent.map((r) => (
            <li key={r.id} className="text-sm flex items-center justify-between">
              <span className="font-medium">{r.title}</span>
              <span className="text-neutral-600">{r.meta}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
