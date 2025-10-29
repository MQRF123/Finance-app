import React from "react";

interface SimulacionSidebarProps {
  step: 1 | 2 | 3;
}

export function SimulacionSidebar({ step }: SimulacionSidebarProps) {
  return (
    <aside className="rounded-2xl bg-emerald-800 text-white p-4 space-y-3">
       المحتوى
      {[ 
        { n: 1, t: "Selecciona\nla vivienda" },
        { n: 2, t: "Financiamiento\ny condiciones" },
        { n: 3, t: "Resultados" },
      ].map((it) => (
        <div
          key={it.n}
          className={`px-3 py-3 rounded-xl whitespace-pre-line ${ 
            step === it.n ? "bg-emerald-700" : "bg-emerald-900/20"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="inline-grid place-items-center h-6 w-6 rounded-full bg-white/10 border border-white/30">
              {it.n}
            </span>
            <span className="text-sm">{it.t}</span>
          </div>
        </div>
      ))}
    </aside>
  );
}
