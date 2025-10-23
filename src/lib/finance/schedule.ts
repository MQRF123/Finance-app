// src/lib/finance/schedule.ts
import { toEffectiveAnnualFromMonthly } from "./rates";
import { irr, npv } from "./cashflows";

export type GraceType = "sin" | "parcial" | "total";

export type SeguroDesgravamen =
  | { mode: "fijo"; monto: number }
  | { mode: "porcentaje"; tasaMensual: number; base: "saldo" | "saldo_promedio" };

export interface SimInput {
  principal: number;              // Monto financiado (P)
  nMeses: number;                 // Plazo total en meses
  iMensual: number;               // Tasa periódica mensual (proporción)
  graciaMeses: number;
  graciaTipo: GraceType;          // "parcial" paga intereses; "total" capitaliza
  itf: number;                    // p.ej. 0.00005 = 0.005%
  seguro: SeguroDesgravamen;      // fijo o %
  costosIniciales: number;        // notariales/registrales/tasación/etc. (no financiados)
  cobraSeguroEnGraciaTotal?: boolean;
}

export interface Row {
  mes: number;
  cuota: number;        // cuota francesa base (sin seguro/ITF)
  interes: number;
  amortizacion: number;
  seguro: number;
  itf: number;
  cuotaTotal: number;   // cuota + seguro + itf
  saldo: number;
}

export interface SimOutput {
  rows: Row[];
  desembolsoNeto: number;   // t0 para el cliente (P - costosIniciales)
  pagoConstante: number;    // cuota francesa después de gracia
  Pfinanciado: number;      // saldo tras la etapa de gracia
  totInteres: number;
  totSeguros: number;
  totITF: number;
  flujo: number[];          // cashflow cliente: t0 positivo, pagos negativos
  tirMensual: number | null;
  tcea: number | null;      // efectiva anual
  vanMensual: number;       // VAN a iMensual
}

export function generarPlan(input: SimInput): SimOutput {
  const {
    principal, nMeses, iMensual, graciaMeses, graciaTipo, itf, seguro,
    costosIniciales, cobraSeguroEnGraciaTotal = false,
  } = input;

  let saldo = principal;
  const rows: Row[] = [];
  const flujo: number[] = [];

  // t0 para el cliente
  const desembolsoNeto = principal - costosIniciales;
  flujo.push(desembolsoNeto);

  // === Gracia ===
  for (let m = 1; m <= graciaMeses; m++) {
    const interes = saldo * iMensual;
    const seguroMes = calcSeguro(seguro, saldo, iMensual);

    if (graciaTipo === "parcial") {
      const pagoInteres = interes + seguroMes;
      const itfMes = pagoInteres * itf;
      rows.push({
        mes: m,
        cuota: 0,
        interes,
        amortizacion: 0,
        seguro: seguroMes,
        itf: itfMes,
        cuotaTotal: pagoInteres + itfMes,
        saldo,
      });
      flujo.push(-(pagoInteres + itfMes));
    } else if (graciaTipo === "total") {
      // sin pagos; capitaliza interés
      let itfMes = 0;
      if (cobraSeguroEnGraciaTotal && seguroMes > 0) {
        itfMes = seguroMes * itf;
        flujo.push(-(seguroMes + itfMes));
      } else {
        flujo.push(0);
      }
      rows.push({
        mes: m,
        cuota: 0,
        interes,
        amortizacion: 0,
        seguro: seguroMes,
        itf: itfMes,
        cuotaTotal: cobraSeguroEnGraciaTotal ? seguroMes + itfMes : 0,
        saldo: saldo + interes, // capitalización
      });
      saldo += interes;
    } else {
      // "sin" (no debería haber filas de gracia en este modo)
      rows.push({
        mes: m,
        cuota: 0,
        interes: 0,
        amortizacion: 0,
        seguro: 0,
        itf: 0,
        cuotaTotal: 0,
        saldo,
      });
      flujo.push(0);
    }
  }

  // === Cuota francesa ===
  const rem = nMeses - graciaMeses;
  const pagoConstante = rem > 0 ? cuotaFrancesa(saldo, iMensual, rem) : 0;

  for (let k = 1; k <= rem; k++) {
    const mes = graciaMeses + k;
    const interes = saldo * iMensual;
    let amort = pagoConstante - interes;
    if (amort < 0) amort = 0; // defensa numérica

    const seguroMes = calcSeguro(seguro, saldo, iMensual);
    const itfMes = (pagoConstante + seguroMes) * itf;
    const cuotaTotal = pagoConstante + seguroMes + itfMes;

    saldo -= amort;

    rows.push({
      mes,
      cuota: pagoConstante,
      interes,
      amortizacion: amort,
      seguro: seguroMes,
      itf: itfMes,
      cuotaTotal,
      saldo,
    });

    flujo.push(-cuotaTotal);
  }

  const totInteres = rows.reduce((a, r) => a + r.interes, 0);
  const totSeguros = rows.reduce((a, r) => a + r.seguro, 0);
  const totITF = rows.reduce((a, r) => a + r.itf, 0);

  let tirMensual: number | null = null;
  let tcea: number | null = null;
  try {
    const r = irr(flujo, 0.01);
    if (Number.isFinite(r)) {
      tirMensual = r;
      tcea = toEffectiveAnnualFromMonthly(r);
    }
  } catch {
    // flujo sin cambio de signo, no hay IRR
  }

  const vanMensual = npv(iMensual, flujo);

  return {
    rows,
    desembolsoNeto,
    pagoConstante,
    Pfinanciado: principal,
    totInteres,
    totSeguros,
    totITF,
    flujo,
    tirMensual,
    tcea,
    vanMensual,
  };
}

/* ---------- helpers ---------- */

function cuotaFrancesa(P: number, i: number, n: number): number {
  if (n <= 0) return 0;
  if (i <= 0) return P / n;
  const f = Math.pow(1 + i, n);
  return (P * i * f) / (f - 1);
}

function calcSeguro(seguro: SeguroDesgravamen, saldo: number, iMensual: number): number {
  if (seguro.mode === "fijo") return seguro.monto;
  const base =
    seguro.base === "saldo_promedio"
      ? (saldo + Math.max(0, saldo - saldo * iMensual)) / 2
      : saldo;
  return base * seguro.tasaMensual;
}
