'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth/use-auth';
import { type Simulacion } from '@/lib/simulacion/types';
import { toSimulacion, fmtMoney } from '@/lib/simulacion/utils';

export default function DashboardPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Simulacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string>('');

  // Carga en tiempo real las últimas simulaciones del usuario
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    setErr('');

    const col = collection(db, 'simulaciones');
    // userId == uid + orden por fecha desc (necesita índice compuesto la 1ª vez)
    const q = query(col, where('userId', '==', user.uid), orderBy('createdAt', 'desc'), limit(50));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map(toSimulacion);
        setRows(list);
        setLoading(false);
      },
      (e) => {
        console.error(e);
        setErr(
          e?.message?.includes('insufficient permissions')
            ? 'No tienes permisos para leer las simulaciones. Revisa tus Firestore Rules.'
            : e?.message ?? 'Error al leer datos'
        );
        setLoading(false);
      }
    );

    return () => unsub();
  }, [user]);

  /** KPIs calculados */
  const { total, tceaProm, monto30 } = useMemo(() => {
    if (!rows.length) return { total: 0, tceaProm: 0, monto30: 0 };

    const total = rows.length;
    const tceaProm = rows.reduce((acc, r) => acc + (r.tcea && isFinite(r.tcea) ? r.tcea : 0), 0) / total;

    const now = Date.now();
    const from = now - 30 * 24 * 60 * 60 * 1000;
    const monto30 = rows
      .filter((r) => {
        if (!r.createdAt) {
          return false;
        }
        const date = r.createdAt instanceof Timestamp ? r.createdAt.toDate() : r.createdAt;
        return date.getTime() >= from;
      })
      .reduce((acc, r) => acc + (isFinite(r.monto) ? r.monto : 0), 0);

    // monedaRef solo para mostrar (si mezclas monedas, aquí podrías separar por moneda)
    return { total, tceaProm, monto30 };
  }, [rows]);

  const kpis = useMemo(
    () => [
      { label: 'Simulaciones', value: String(total) },
      { label: 'TCEA promedio', value: `${(tceaProm * 100).toFixed(2)}%` },
      { label: 'Monto simulado', value: fmtMoney(monto30), hint: 'Últimos 30 días' },
    ],
    [total, tceaProm, monto30]
  );

  const recientes = rows.slice(0, 5);

  return (
    <section className="space-y-6">
      <header className="flex items-baseline justify-between">
        <div>
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <p className="text-sm text-neutral-600">
            Hola{user?.displayName ? `, ${user.displayName}` : ''} {user?.email ? `(${user.email})` : ''}
          </p>
        </div>
      </header>

      {err && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{err}</div>}

      {/* Estado de carga */}
      {loading && !rows.length ? (
        <div className="rounded-2xl border bg-white p-6 text-sm text-neutral-600">Cargando datos…</div>
      ) : (
        <>
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
            {recientes.length === 0 ? (
              <p className="text-sm text-neutral-600">Aún no tienes simulaciones.</p>
            ) : (
              <ul className="space-y-2">
                {recientes.map((r) => {
                  const titulo = r.nombre ?? `Simulación #${r.id.slice(0, 6).toUpperCase()}`;
                  const meta = `TCEA ${((r.tcea ?? 0) * 100).toFixed(1)}% · ${r.plazoMeses}m`;
                  return (
                    <li key={r.id} className="text-sm flex items-center justify-between">
                      <Link href={`/simulaciones/${r.id}`} className="font-medium hover:underline">
                        {titulo}
                      </Link>
                      <span className="text-neutral-600">{meta}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </>
      )}
    </section>
  );
}
