'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/use-auth';
import { getSimulacionById } from '@/lib/simulacion/services/firebase';
import { generarPlan, type SimInput } from '@/lib/calculations/schedule';
import { tasaMensual, fmtMoney } from '@/lib/simulacion/utils';
import { Simulacion } from '@/lib/simulacion/types';

type Props = unknown;

// Helper para formatear porcentajes
const fmtPercent = (val: number | null | undefined) => {
  if (val === null || val === undefined) return '-';
  return new Intl.NumberFormat('es-PE', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(val);
};

export default function CronogramaPage(props: Props) {
  // Tipado robusto para params en Next.js 15 (puede ser objeto o Promise)
  const { params } = props as { params: { id: string } | Promise<{ id: string }> };

  // Función para detectar si es una promesa
  function isThenable<T = unknown>(v: unknown): v is Promise<T> {
    return typeof v === 'object' && v !== null && 'then' in v && typeof (v as { then?: unknown }).then === 'function';
  }

  // Hook use() shim para desenvolver la promesa si es necesario
  type ReactUse = { use: <T>(p: Promise<T>) => T };
  const resolvedParams = isThenable(params)
    ? (React as unknown as ReactUse).use(params as Promise<{ id: string }>)
    : (params as { id: string });

  const { id } = resolvedParams;
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
    } else if (user === null) {
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
        <p className="text-neutral-600">No se pudo encontrar la simulación con ID: {id}.</p>
      </div>
    );
  }

  const formVals = simData.form;
  
  // --- CORRECCIONES DE CÁLCULO ---
  // 1. Convertir TEA entero (ej. 9) a decimal (0.09)
  const iMensual = tasaMensual(formVals.tasaValor / 100); 
  
  const totalGastos = formVals.gastosNotariales + formVals.gastosRegistrales + formVals.tasacionPerito;

  // 2. Calcular COK para el VAN (también dividiendo entre 100)
  const cokDecimal = (formVals.cokValor || formVals.tasaValor) / 100;
  const cokMensual = tasaMensual(cokDecimal);

  const simInput: SimInput = {
    principal: simData.monto,
    nMeses: formVals.plazoMeses,
    iMensual: iMensual,
    graciaMeses: formVals.mesesGracia,
    graciaTipo: formVals.tipoGracia,
    itf: 0.00005,
    seguro: {
      mode: "porcentaje",
      // 3. CORRECCIÓN CRÍTICA: Dividir seguro entre 100 (ej. 0.028 -> 0.00028)
      tasaMensual: formVals.tasaDesgravamenMensual / 100,
      base: formVals.baseSeguroDesgravamen,
    },
    costosIniciales: formVals.financiarGastos ? 0 : totalGastos,
    cobraSeguroEnGraciaTotal: formVals.tipoGracia === "total",
    cokMensual, // Pasamos la COK correcta para el VAN
  };

  // Generamos el plan y extraemos indicadores
  const { rows, Pfinanciado, vanMensual, tirMensual, tcea } = generarPlan(simInput);

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Cronograma de Pagos</h1>
        <p className="text-sm text-neutral-600">
          Proyecto: {simData.nombre || 'Sin nombre'} (ID: {simData.id})
        </p>
      </div>

      {/* Panel de Indicadores Financieros */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border shadow-sm">
          <p className="text-sm text-neutral-500 font-medium">VAN (Valor Actual Neto)</p>
          {/* Muestra verde si es positivo, rojo si es negativo */}
          <p className={`text-2xl font-semibold mt-1 ${vanMensual >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {fmtMoney(vanMensual)}
          </p>
          <p className="text-xs text-neutral-400 mt-1">
            COK: {formVals.cokValor || formVals.tasaValor}%
          </p>
        </div>
        
        <div className="bg-white p-4 rounded-xl border shadow-sm">
          <p className="text-sm text-neutral-500 font-medium">TIR (Mensual)</p>
          <p className="text-2xl font-semibold text-blue-600 mt-1">
            {fmtPercent(tirMensual)}
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border shadow-sm">
          <p className="text-sm text-neutral-500 font-medium">TCEA (Anual)</p>
          <p className="text-2xl font-semibold text-purple-600 mt-1">
            {fmtPercent(tcea)}
          </p>
        </div>
      </div>

      {/* Tabla de Cronograma */}
      <div className="rounded-2xl border bg-white overflow-x-auto shadow-sm">
        <table className="w-full text-sm">
          <thead className="text-left text-neutral-600 bg-gray-50">
            <tr className="[&>th]:px-4 [&>th]:py-3 border-b font-medium">
              <th>Mes</th>
              <th>Cuota Total</th>
              <th>Interés</th>
              <th>Amortización</th>
              <th>Seguro</th>
              <th>Saldo Final</th>
            </tr>
          </thead>
          <tbody>
            <tr className="[&>td]:px-4 [&>td]:py-3 border-b font-medium bg-gray-50/50">
              <td>0</td>
              <td colSpan={4} className="text-neutral-500">Desembolso / Préstamo Inicial</td>
              <td className="font-bold text-gray-900">{fmtMoney(Pfinanciado)}</td>
            </tr>
            {rows.map((row) => (
              <tr key={row.mes} className="[&>td]:px-4 [&>td]:py-3 border-b last:border-0 hover:bg-gray-50 transition-colors">
                <td className="font-medium text-gray-900">{row.mes}</td>
                <td className="font-bold text-emerald-700">{fmtMoney(row.cuotaTotal)}</td>
                <td className="text-red-600">{fmtMoney(row.interes)}</td>
                <td className="text-blue-600">{fmtMoney(row.amortizacion)}</td>
                <td className="text-gray-600">{fmtMoney(row.seguro)}</td>
                <td className="font-medium text-gray-900">{fmtMoney(row.saldo)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}