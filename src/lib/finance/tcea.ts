// src/lib/finance/tcea.ts
// Cálculo de TCEA a partir del flujo mensual del cliente (t0, t1, ..., tn)

import { irr } from "./cashflows";
import { toEffectiveAnnualFromMonthly } from "./rates";

/**
 * Retorna la TCEA (efectiva anual) a partir del flujo mensual del cliente.
 * @param cashflow Arreglo de flujos mensuales: t0 (positivo, desembolso neto) y pagos negativos.
 * @param guess Valor inicial para IRR (opcional, por defecto 0.01 = 1%).
 * @returns TCEA (proporción anual), o null si no existe IRR (flujo sin cambio de signo, etc).
 */
export function tceaFromCashflow(
  cashflow: number[],
  guess: number = 0.01
): number | null {
  if (!Array.isArray(cashflow) || cashflow.length === 0) return null;
  try {
    const r = irr(cashflow, guess); // tasa mensual
    return Number.isFinite(r) ? toEffectiveAnnualFromMonthly(r) : null;
  } catch {
    return null;
  }
}
