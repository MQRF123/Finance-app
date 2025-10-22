"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";

type Row = {
  id: string;
  nombre?: string;
  solicitante?: string;
  proyecto?: string;
  programa?: "Regular" | "Verde";
  moneda?: "S/" | "US$";
  tea?: number;
  tcea?: number | null;
  estado?: "Aprobado" | "En proceso" | "Rechazado";
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [qtxt, setQtxt] = useState("");

  useEffect(() => {
    if (!user) return;
    (async () => {
      const ref = query(
        collection(db, "simulaciones"),
        where("uid", "==", user.uid),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(ref);
      const data: Row[] = snap.docs.map(d => {
        const x = d.data() as any;
        return {
          id: d.id,
          nombre: x.nombre,
          solicitante: x.solicitante ?? x.nombre ?? "—",
          proyecto: x.proyecto ?? "—",
          programa: x.programa ?? "Regular",
          moneda: "S/",
          tea: typeof x.tea === "number" ? x.tea : undefined,
          tcea: x.tcea ?? null,
          estado: x.estado ?? (x.tcea != null ? "Aprobado" : "En proceso"),
        };
      });
      setRows(data);
    })();
  }, [user]);

  const filtered = useMemo(() => {
    const s = qtxt.toLowerCase();
    return rows.filter(r =>
      [r.nombre, r.solicitante, r.proyecto].some(v => (v ?? "").toLowerCase().includes(s))
    );
  }, [rows, qtxt]);

  return (
    <section className="space-y-4">
      {/* Encabezado con título + buscador + botón */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h1 className="text-xl font-semibold">Histórico</h1>
        <div className="flex items-center gap-3">
          <input
            value={qtxt}
            onChange={(e) => setQtxt(e.target.value)}
            placeholder="Search"
            className="w-64 rounded-lg border px-3 py-2 bg-white"
          />
          <Link
            href="/simulaciones/nueva"
            className="rounded-lg bg-emerald-700 text-white px-3 py-2 hover:bg-emerald-800"
          >
            Nueva simulación
          </Link>
        </div>
      </div>

      {/* Tabla dentro de card suave */}
      <div className="rounded-xl border bg-white overflow-auto">
        <table className="min-w-[900px] w-full text-sm">
          <thead className="bg-neutral-50">
            <tr>
              <Th>Solicitante</Th>
              <Th>Proyecto</Th>
              <Th>Programa</Th>
              <Th>Moneda</Th>
              <Th className="text-right">Tasa</Th>
              <Th>Estado</Th>
              <Th></Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r.id} className="border-t">
                <Td>{r.solicitante}</Td>
                <Td>{r.proyecto}</Td>
                <Td>{r.programa}</Td>
                <Td>{r.moneda}</Td>
                <Td right>{r.tea != null ? `${(r.tea * 100).toFixed(1)}%` : "—"}</Td>
                <Td>{r.estado ? <Badge kind={r.estado} /> : "—"}</Td>
                <Td>
                  <Link href={`/simulaciones/${r.id}`} className="text-emerald-700 underline">Abrir</Link>
                </Td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <Td colSpan={7}>
                  <div className="p-4 text-neutral-600">Sin resultados</div>
                </Td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* Helpers de tabla y badge */

function Th({ children, className }: any) {
  return <th className={`p-2 text-left font-medium ${className ?? ""}`}>{children}</th>;
}
function Td({ children, right, colSpan, className }: any) {
  return <td colSpan={colSpan} className={`p-2 ${right ? "text-right" : ""} ${className ?? ""}`}>{children}</td>;
}
function Badge({ kind }: { kind: "Aprobado" | "En proceso" | "Rechazado" }) {
  const styles = {
    "Aprobado": "bg-emerald-100 text-emerald-800 border-emerald-200",
    "En proceso": "bg-amber-100 text-amber-800 border-amber-200",
    "Rechazado": "bg-red-100 text-red-800 border-red-200",
  }[kind];
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs border ${styles}`}>{kind}</span>;
}
