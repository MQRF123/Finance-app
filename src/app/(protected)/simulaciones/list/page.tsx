"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, getDocs, orderBy, query, where, DocumentData } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";
import type { Simulacion } from "@/types/simulacion";
import { formatMoney, formatPercent } from "@/lib/utils/format";

type SimulacionDoc = Simulacion & { id: string };

export default function SimulacionesListPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<SimulacionDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!user) return;
      try {
        const qref = query(
          collection(db, "simulaciones"),
          where("uid", "==", user.uid),
          orderBy("createdAt", "desc")
        );
        const snap = await getDocs(qref);
        const list: SimulacionDoc[] = snap.docs.map((d) => {
          const x = d.data() as DocumentData;
          return {
            id: d.id,
            uid: String(x.uid),
            clienteId: x.clienteId ?? null,
            unidadId: x.unidadId ?? null,
            entidadId: x.entidadId ?? null,

            moneda: (x.moneda ?? "PEN") as Simulacion["moneda"],
            tipoTasa: (x.tipoTasa ?? "TEA") as Simulacion["tipoTasa"],
            tasaValor: Number(x.tasaValor ?? 0),
            capitalizacion: x.capitalizacion ? Number(x.capitalizacion) : undefined,
            plazoMeses: Number(x.plazoMeses ?? 0),
            graciaTipo: (x.graciaTipo ?? "sin") as Simulacion["graciaTipo"],
            graciaMeses: Number(x.graciaMeses ?? 0),

            precioVenta: Number(x.precioVenta ?? 0),
            cuotaInicial: Number(x.cuotaInicial ?? 0),
            bonos: Array.isArray(x.bonos) ? x.bonos : [],

            itf: Number(x.itf ?? 0),
            costosIniciales: x.costosIniciales ? Number(x.costosIniciales) : undefined,
            gastosNotariales: x.gastosNotariales ? Number(x.gastosNotariales) : undefined,
            gastosRegistrales: x.gastosRegistrales ? Number(x.gastosRegistrales) : undefined,
            tasacionPerito: x.tasacionPerito ? Number(x.tasacionPerito) : undefined,
            adminInicialSoles: x.adminInicialSoles ? Number(x.adminInicialSoles) : undefined,

            seguro: x.seguro ?? undefined,
            cobraSeguroEnGraciaTotal: x.cobraSeguroEnGraciaTotal ?? undefined,

            tcea: x.tcea ?? null,
            tirMensual: x.tirMensual ?? null,
            vanMensual: typeof x.vanMensual === "number" ? x.vanMensual : undefined,
            totInteres: typeof x.totInteres === "number" ? x.totInteres : undefined,
            totSeguros: typeof x.totSeguros === "number" ? x.totSeguros : undefined,
            totITF: typeof x.totITF === "number" ? x.totITF : undefined,
            desembolsoNeto: typeof x.desembolsoNeto === "number" ? x.desembolsoNeto : undefined,
            pagoConstante: typeof x.pagoConstante === "number" ? x.pagoConstante : undefined,

            createdAt: x.createdAt,
            updatedAt: x.updatedAt,
          };
        });

        // Orden de respaldo por timestamp si faltara el índice
        list.sort((a, b) => {
          const ams = a.createdAt?.toMillis?.() ?? 0;
          const bms = b.createdAt?.toMillis?.() ?? 0;
          return bms - ams;
        });

        if (alive) setRows(list);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [user]);

  if (!user) {
    return <p className="text-sm text-neutral-600">Inicia sesión para ver tus simulaciones.</p>;
  }

  if (loading) {
    return <p className="text-sm text-neutral-600">Cargando simulaciones…</p>;
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border bg-white p-6 text-center text-sm text-neutral-600">
        No tienes simulaciones aún.
      </div>
    );
  }

  return (
    <section className="space-y-4">
      <h1 className="text-xl font-semibold">Mis simulaciones</h1>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rows.map((r) => {
          const titulo = `Simulación ${r.id.slice(0, 6)}…`;
          const tasaStr =
            r.tipoTasa === "TEA"
              ? `${formatPercent(r.tasaValor, 2)} TEA`
              : `${formatPercent(r.tasaValor, 2)} TNA c/${r.capitalizacion ?? 12}`;
          const plazoStr = `${r.plazoMeses} meses`;
          const moneda = r.moneda;
          const created =
            r.createdAt?.toDate?.()
              ? r.createdAt.toDate().toLocaleDateString("es-PE")
              : "—";
          const pago = typeof r.pagoConstante === "number" ? formatMoney(r.pagoConstante, moneda) : "—";
          const tceaStr = typeof r.tcea === "number" ? formatPercent(r.tcea, 2) : "—";

          return (
            <Link
              key={r.id}
              href={`/ (protected)/simulaciones/${r.id}`.replace(/\s/g, "")}
              className="rounded-2xl border bg-white p-4 flex flex-col hover:shadow-sm transition"
            >
              <div className="flex-1">
                <div className="font-medium">{titulo}</div>
                <div className="text-sm text-neutral-600 mt-1">
                  {plazoStr} · {tasaStr}
                </div>
                <div className="text-sm text-neutral-600">Creada: {created}</div>
              </div>

              <div className="mt-3 border-t pt-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-neutral-600">Cuota aprox.</span>
                  <span className="font-medium">{pago}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600">TCEA</span>
                  <span className="font-medium">{tceaStr}</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
