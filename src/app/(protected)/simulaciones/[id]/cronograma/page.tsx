"use client";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useEffect, useState } from "react";
import { generarCronograma } from "@/lib/finance/cronograma";

export default function CronogramaPage({ params }: { params: { id: string } }) {
  const [sim, setSim] = useState<any>(null);
  useEffect(() => { (async () => { const snap = await getDoc(doc(db, "simulaciones", params.id)); setSim(snap.data()); })(); }, [params.id]);
  if (!sim) return <div>Cargando…</div>;
  const out = generarCronograma(sim);

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Cronograma</h1>
        <p className="text-neutral-600 text-sm">Incluye Seguro e ITF en cada periodo.</p>
      </div>

      <div className="rounded-2xl border bg-white overflow-auto">
        <table className="min-w-[960px] w-full text-sm">
          <thead className="bg-neutral-50">
            <tr>
              <Th>Mes</Th><Th className="text-right">Cuota</Th><Th className="text-right">Interés</Th>
              <Th className="text-right">Amort.</Th><Th className="text-right">Seguro</Th>
              <Th className="text-right">ITF</Th><Th className="text-right">Cuota Total</Th>
              <Th className="text-right">Saldo</Th>
            </tr>
          </thead>
          <tbody>
            {out.rows.map((r) => (
              <tr key={r.mes} className="border-t">
                <Td>{r.mes}</Td>
                <Td right>{r.cuota.toFixed(2)}</Td>
                <Td right>{r.interes.toFixed(2)}</Td>
                <Td right>{r.amortizacion.toFixed(2)}</Td>
                <Td right>{r.seguro.toFixed(2)}</Td>
                <Td right>{r.itf.toFixed(4)}</Td>
                <Td right className="font-medium">{r.cuotaTotal.toFixed(2)}</Td>
                <Td right>{r.saldo.toFixed(2)}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Th({ children, className }: any) {
  return <th className={`p-2 text-left font-medium ${className ?? ""}`}>{children}</th>;
}
function Td({ children, right, className }: any) {
  return <td className={`p-2 ${right ? "text-right" : ""} ${className ?? ""}`}>{children}</td>;
}
