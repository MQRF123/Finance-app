"use client";

import type React from "react";
import { type Casa } from "@/lib/simulacion/types";
import { fmtMoney } from "@/lib/simulacion/utils";

// 1. Definimos y exportamos el catálogo de casas aquí
export const casas: Casa[] = [
  { id: "c1", titulo: "Casa Miraflores", precio: 250000, m2: 118, eco: true,  distrito: "Miraflores" },
  { id: "c2", titulo: "Casa Surco",       precio: 235000, m2: 112, eco: false, distrito: "Santiago de Surco" },
  { id: "c3", titulo: "Casa Chorrillos",  precio: 199000, m2: 98,  eco: true,  distrito: "Chorrillos" },
  { id: "c4", titulo: "Casa San Miguel",  precio: 185000, m2: 86,  eco: false, distrito: "San Miguel" },
  { id: "c5", titulo: "Casa Comas",       precio: 150000, m2: 76,  eco: false, distrito: "Comas" },
  { id: "c6", titulo: "Casa Magdalena",   precio: 210000, m2: 94,  eco: true,  distrito: "Magdalena del Mar" },
  { id: "c7", titulo: "Casa Ate",         precio: 165000, m2: 80,  eco: false, distrito: "Ate" },
  { id: "c8", titulo: "Casa San Borja",   precio: 245000, m2: 120, eco: true,  distrito: "San Borja" },
];

import { calcularBonoBuenPagador } from "@/lib/simulacion/bonos";

// 2. Creamos el componente que renderiza las tarjetas
interface SimulacionCardsProps {
  selCasa: string | null;
  onCasaSelect: (casa: Casa) => void;
}

export function SimulacionCards({ selCasa, onCasaSelect }: SimulacionCardsProps) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {casas.map((c) => {
        const active = selCasa === c.id;
        const bbp = calcularBonoBuenPagador(c.precio) > 0;
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onCasaSelect(c)}
            className={`text-left rounded-2xl border bg-white p-4 transition
              ${active ? "ring-2 ring-emerald-500 border-emerald-500" : "hover:shadow-sm"}`}
          >
            <div className="flex items-start justify-between">
              <div className="font-medium">{c.titulo}</div>
              <div className="flex gap-2">
                {bbp && (
                  <span className="text-[10px] rounded-full bg-blue-100 text-blue-700 px-2 py-1 border border-blue-200">
                    BBP
                  </span>
                )}
                {c.eco && (
                  <span className="text-[10px] rounded-full bg-emerald-100 text-emerald-700 px-2 py-1 border border-emerald-200">
                    Bono Verde
                  </span>
                )}
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold">{fmtMoney(c.precio)}</div>
            <div className="text-sm text-neutral-600 mt-1">{c.m2} m² · {c.distrito}</div>
            {active && <div className="text-xs text-emerald-700 mt-2">Seleccionada</div>}
          </button>
        );
      })}
    </div>
  );
}