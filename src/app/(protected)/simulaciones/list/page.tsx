"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";

/* ===== Tipos ===== */
type Moneda = "PEN" | "USD";
type Estado = "Aprobado" | "Rechazado" | "En proceso" | undefined;

type Simulacion = {
  id: string;
  userId: string;
  createdAt: Timestamp | Date;
  tcea: number;          // proporción (0.1325 = 13.25%)
  plazoMeses: number;
  monto: number;
  moneda?: Moneda;
  nombre?: string;
  estado?: Estado;
};

/* ===== Helpers ===== */
function toSimulacion(d: QueryDocumentSnapshot<DocumentData>): Simulacion {
  const x = d.data();
  const createdAt =
    x.createdAt instanceof Timestamp
      ? x.createdAt
      : typeof x.createdAt === "number"
      ? new Date(x.createdAt)
      : new Date();
  return {
    id: d.id,
    userId: String(x.userId ?? ""),
    createdAt,
    tcea: Number(x.tcea ?? 0),
    plazoMeses: Number(x.plazoMeses ?? 0),
    monto: Number(x.monto ?? 0),
    moneda: (x.moneda as Moneda) ?? "PEN",
    nombre: typeof x.nombre === "string" ? x.nombre : undefined,
    estado: typeof x.estado === "string" ? (x.estado as Estado) : undefined,
  };
}

function fmtMoney(v: number, m: Moneda = "PEN") {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: m === "USD" ? "USD" : "PEN",
    minimumFractionDigits: 2,
  }).format(v);
}

function fmtDate(t: Timestamp | Date) {
  const d = t instanceof Timestamp ? t.toDate() : t;
  return new Intl.DateTimeFormat("es-PE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

function Badge({ estado }: { estado: Estado }) {
  const map: Record<Exclude<Estado, undefined>, string> = {
    Aprobado: "bg-emerald-100 text-emerald-800 border-emerald-200",
    "En proceso": "bg-amber-100 text-amber-800 border-amber-200",
    Rechazado: "bg-rose-100 text-rose-800 border-rose-200",
  };
  if (!estado) return <span className="text-neutral-500">—</span>;
  return (
    <span className={`text-xs px-2 py-1 rounded-full border ${map[estado]}`}>
      {estado}
    </span>
  );
}

/* ===== Página ===== */
export default function HistorialPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Simulacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string>("");
  const [qtext, setQtext] = useState("");
  const [fEstado, setFEstado] = useState<Estado | "Todos">("Todos");

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    setErr("");

    const col = collection(db, "simulaciones");
    // Requiere índice: userId ASC + createdAt DESC (ya te pasé el indexes.json)
    const qy = query(col, where("userId", "==", user.uid), orderBy("createdAt", "desc"));

    const unsub = onSnapshot(
      qy,
      (snap) => {
        setRows(snap.docs.map(toSimulacion));
        setLoading(false);
      },
      (e) => {
        console.error(e);
        setErr(
          e?.message?.includes("insufficient permissions")
            ? "No tienes permisos para leer el historial. Revisa tus Reglas de Firestore."
            : e?.message ?? "Error al leer datos"
        );
        setLoading(false);
      }
    );
    return () => unsub();
  }, [user]);

  const filtered = useMemo(() => {
    const s = qtext.trim().toLowerCase();
    return rows.filter((r) => {
      const okEstado = fEstado === "Todos" ? true : r.estado === fEstado;
      if (!s) return okEstado;
      const title = (r.nombre ?? `Simulación #${r.id.slice(0, 6).toUpperCase()}`).toLowerCase();
      const id6 = r.id.slice(0, 6).toLowerCase();
      return okEstado && (title.includes(s) || id6.includes(s));
    });
  }, [rows, qtext, fEstado]);

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold">Historial</h1>
          <p className="text-sm text-neutral-600">Tus simulaciones guardadas</p>
        </div>

        <div className="flex gap-2">
          <input
            value={qtext}
            onChange={(e) => setQtext(e.target.value)}
            placeholder="Buscar por nombre o ID…"
            className="rounded-xl border px-3 py-2 text-sm"
          />
          <select
            value={fEstado ?? "Todos"}
            onChange={(e) => setFEstado((e.target.value as Estado | "Todos") || "Todos")}
            className="rounded-xl border px-3 py-2 text-sm"
          >
            <option value="Todos">Todos</option>
            <option value="Aprobado">Aprobado</option>
            <option value="En proceso">En proceso</option>
            <option value="Rechazado">Rechazado</option>
          </select>
          <Link
            href="/simulaciones/nueva"
            className="rounded-lg bg-emerald-700 text-white px-3 py-2 text-sm hover:bg-emerald-800"
          >
            Nueva simulación
          </Link>
        </div>
      </div>

      {err && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{err}</div>}

      <div className="rounded-2xl border bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-neutral-600">
            <tr className="[&>th]:px-3 [&>th]:py-3 border-b">
              <th>Título</th>
              <th className="whitespace-nowrap">Fecha</th>
              <th className="whitespace-nowrap">Monto</th>
              <th className="whitespace-nowrap">TCEA</th>
              <th className="whitespace-nowrap">Plazo</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading && rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-neutral-600">
                  Cargando…
                </td>
              </tr>
            )}

            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-neutral-600">
                  No hay simulaciones.
                </td>
              </tr>
            )}

            {filtered.map((r) => {
              const titulo = r.nombre ?? `Simulación #${r.id.slice(0, 6).toUpperCase()}`;
              const fecha = fmtDate(r.createdAt);
              const tcea = `${(r.tcea * 100).toFixed(2)}%`;
              return (
                <tr key={r.id} className="[&>td]:px-3 [&>td]:py-3 border-b last:border-0">
                  <td className="font-medium">{titulo}</td>
                  <td>{fecha}</td>
                  <td className="whitespace-nowrap">{fmtMoney(r.monto, r.moneda ?? "PEN")}</td>
                  <td>{tcea}</td>
                  <td className="whitespace-nowrap">{r.plazoMeses} m</td>
                  <td>
                    <Badge estado={r.estado} />
                  </td>
                  <td className="text-right">
                    <Link
                      href={`/simulaciones/${r.id}`}
                      className="text-emerald-700 hover:underline"
                    >
                      Ver
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
