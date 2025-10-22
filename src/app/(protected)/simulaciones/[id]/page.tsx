"use client";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useEffect, useState } from "react";
import Link from "next/link";
import { fmtMoney, fmtPct } from "@/lib/utils/format";
import { generarCronograma } from "@/lib/finance/cronograma";

export default function SimulacionDetallePage({ params }: { params: { id: string } }) {
  const [data, setData] = useState<any>(null);
  useEffect(() => { (async () => { const snap = await getDoc(doc(db, "simulaciones", params.id)); setData(snap.data()); })(); }, [params.id]);
  if (!data) return <div>Cargando…</div>;

  const out = generarCronograma(data);

  return (
    <section className="space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold">{data?.nombre ?? "Simulación"}</h1>
          <p className="text-neutral-600 text-sm">Resumen general de la simulación</p>
        </div>
        <Link href={`/simulaciones/${params.id}/cronograma`} className="rounded-xl bg-black text-white px-3 py-1.5">Ver cronograma</Link>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Info title="Desembolso neto (t₀)" value={fmtMoney(out.desembolsoNeto)} />
        <Info title="Principal financiado" value={fmtMoney(out.Pfinanciado)} />
        <Info title="TCEA" value={data?.tcea != null ? fmtPct(data.tcea) : "—"} />
        <Info title="Plazo" value={`${data?.nMeses} meses`} />
        <Info title="TEA" value={fmtPct(data?.tea)} />
        <Info title="Base de seguro" value={data?.baseSeguroDesgravamen} />
      </div>
    </section>
  );
}

function Info({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="text-xs text-neutral-600">{title}</div>
      <div className="mt-1 font-semibold">{value}</div>
    </div>
  );
}
