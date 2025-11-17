'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/use-auth';
import { getSimulacionById } from '@/lib/simulacion/services/firebase';
import { generarPlan, type SimInput } from '@/lib/calculations/schedule';
import { tasaMensual, fmtMoney } from '@/lib/simulacion/utils';
import { Simulacion } from '@/lib/simulacion/types';

type Props = unknown;

export default function CronogramaPage(props: Props) {
  const { params } = props as { params: { id: string } | Promise<{ id: string }> };

  // Detect promise-like objects without using `any` (ESLint rule).
  function isThenable<T = unknown>(v: unknown): v is Promise<T> {
    return typeof v === 'object' && v !== null && 'then' in v && typeof (v as { then?: unknown }).then === 'function';
  }

  type ReactUse = { use: <T>(p: Promise<T>) => T };

  const resolvedParams = isThenable(params)
    ? (React as unknown as ReactUse).use(params as Promise<{ id: string }>)
    : (params as { id: string });

  const { id } = resolvedParams as { id: string };
  const { user } = useAuth();
  const [simData, setSimData] = useState<(Simulacion & { id: string }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      getSimulacionById(id)
        .then(data => {
          if (data && data.userId === user.uid) {
            setSimData(data);
          } else {
            setError('No tienes permiso para ver esta simulación.');
          }
        })
        .catch(() => setError('No se pudo cargar la simulación.'))
        .finally(() => setLoading(false));
    } else if (user === null) { // user is null when not logged in, undefined while loading
        setLoading(false);
        setError('Debes iniciar sesión para ver esta página.');
    }
  }, [id, user]);

  if (loading) {
    return <div className="text-center py-10">Cargando...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-600">{error}</div>;
  }

  if (!simData || !simData.form) {
    return (
      <div className="text-center py-10">
        <h1 className="text-xl font-semibold">Simulación no encontrada</h1>
        <p className="text-neutral-600">No se pudo encontrar la simulación con ID: {id} o no tiene datos de formulario.</p>
      </div>
    );
  }

  const formVals = simData.form;
  const iMensual = tasaMensual(formVals.tasaValor);
  const totalGastos = formVals.gastosNotariales + formVals.gastosRegistrales + formVals.tasacionPerito;

  const simInput: SimInput = {
    principal: simData.monto,
    nMeses: formVals.plazoMeses,
    iMensual: iMensual,
    graciaMeses: formVals.mesesGracia,
    graciaTipo: formVals.tipoGracia,
    itf: 0.00005,
    seguro: {
      mode: "porcentaje",
      tasaMensual: formVals.tasaDesgravamenMensual,
      base: formVals.baseSeguroDesgravamen,
    },
    costosIniciales: formVals.financiarGastos ? 0 : totalGastos,
    cobraSeguroEnGraciaTotal: formVals.tipoGracia === "total",
  };

  const { rows, Pfinanciado } = generarPlan(simInput);

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Cronograma de Pagos</h1>
        <p className="text-sm text-neutral-600">Simulación: {simData.nombre || simData.id}</p>
      </div>

      <div className="rounded-2xl border bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-neutral-600">
            <tr className="[&>th]:px-3 [&>th]:py-3 border-b">
              <th>Mes</th>
              <th>Cuota Total</th>
              <th>Interés</th>
              <th>Amortización</th>
              <th>Seguro</th>
              <th>Saldo Final</th>
            </tr>
          </thead>
          <tbody>
            <tr className="[&>td]:px-3 [&>td]:py-3 border-b font-medium">
              <td>0</td>
              <td colSpan={4}>Desembolso</td>
              <td>{fmtMoney(Pfinanciado)}</td>
            </tr>
            {rows.map((row) => (
              <tr key={row.mes} className="[&>td]:px-3 [&>td]:py-3 border-b last:border-0">
                <td>{row.mes}</td>
                <td>{fmtMoney(row.cuotaTotal)}</td>
                <td>{fmtMoney(row.interes)}</td>
                <td>{fmtMoney(row.amortizacion)}</td>
                <td>{fmtMoney(row.seguro)}</td>
                <td>{fmtMoney(row.saldo)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
