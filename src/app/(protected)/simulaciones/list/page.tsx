"use client";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import type { Simulacion } from "@/types/simulacion";

export default function SimulacionesListPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<(Simulacion & { id: string })[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const q = query(
        collection(db, "simulaciones"),
        where("uid", "==", user.uid),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(q);
      setRows(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
    })();
  }, [user]);

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Historial de simulaciones</h1>
        <p className="text-neutral-600 mt-1">Revisa el detalle, cronograma y TCEA.</p>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {rows.map(r => (
          <div key={r.id} className="rounded-2xl border bg-white p-4 flex flex-col">
            <div className="flex-1">
              <div className="font-medium">{r.nombre ?? r.id}</div>
              <div className="text-sm text-neutral-600 mt-1">
                Plazo: {r.nMeses} meses · TEA: {(r.tea*100).toFixed(2)}%
              </div>
              <div className="text-sm text-neutral-600">TCEA: {r.tcea != null ? `${(r.tcea*100).toFixed(2)}%` : "—"}</div>
            </div>
            <div className="mt-3 flex gap-2">
              <Link href={`/simulaciones/${r.id}`} className="rounded-xl bg-black text-white text-sm px-3 py-1.5">Detalle</Link>
              <Link href={`/simulaciones/${r.id}/cronograma`} className="rounded-xl border text-sm px-3 py-1.5">Cronograma</Link>
            </div>
          </div>
        ))}
      </div>

      {rows.length === 0 && (
        <div className="rounded-2xl border bg-white p-6 text-neutral-600">
          No hay simulaciones aún. Crea la primera desde <a href="/simulaciones/nueva" className="underline">aquí</a>.
        </div>
      )}
    </section>
  );
}
