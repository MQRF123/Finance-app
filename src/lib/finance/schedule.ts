import { toEffectiveAnnualFromMonthly } from "./rates";
import { irr, npv } from "./cashflows";

export type GraceType = "sin" | "parcial" | "total";
export type SeguroDesgravamen =
  | { mode: "fijo"; monto: number } // monto fijo mensual
  | { mode: "porcentaje"; tasaMensual: number; base: "saldo" | "saldo_promedio" };

export interface SimInput {
  principal: number;              // P (desembolso del banco)
  nMeses: number;
  iMensual: number;               // tasa periódica mensual (proporción)
  graciaMeses: number;
  graciaTipo: GraceType;          // "parcial" = solo intereses; "total" = sin pagos (capitaliza)
  itf: number;                    // 0.00005 (0.005%)
  seguro: SeguroDesgravamen;      // ver tipo
  costosIniciales: number;        // notariales, registrales, tasación, etc. (no financiados)
  cobraSeguroEnGraciaTotal?: boolean; // default false
}

export interface Row {
  mes: number;
  cuota: number;        // cuota francesa base (después de gracia)
  interes: number;
  amortizacion: number;
  seguro: number;
  itf: number;
  cuotaTotal: number;
  saldo: number;
}

export interface SimOutput {
  rows: Row[];
  desembolsoNeto: number;     // t0 para el cliente (principal - costosIniciales)
  pagoConstante: number;      // cuota después de gracia
  Pfinanciado: number;        // saldo al terminar gracia (con capitalización si aplica)
  totInteres: number;
  totSeguros: number;
  totITF: number;
  flujo: number[];            // cashflow cliente: t0 positivo, pagos negativos
  tirMensual: number | null;  // IRR mensual (si existe)
  tcea: number | null;        // efectiva anual
  vanMensual: number;         // VAN a tasa iMensual (opcional criterio)
}

export function generarPlan(input: SimInput): SimOutput {
  const {
    principal, nMeses, iMensual, graciaMeses, graciaTipo, itf, seguro,
    costosIniciales, cobraSeguroEnGraciaTotal = false,
  } = input;

  let saldo = principal;
  const rows: Row[] = [];
  const flujo: number[] = [];

  // t0 (signo cliente): +desembolso (entra dinero al cliente)
  const desembolsoNeto = principal - costosIniciales;
  flujo.push(desembolsoNeto);

  // === Gracia ===
  for (let m = 1; m <= graciaMeses; m++) {
    const interes = saldo * iMensual;
    const seguroMes = calcSeguro(seguro, saldo, iMensual);
    let cuota = 0, amort = 0, itfMes = 0, pagoTotal = 0;

    if (graciaTipo === "parcial") {
      cuota = 0;                     // sin cuota base
      amort = 0;
      pagoTotal = interes + seguroMes;   // paga solo intereses + seguro
      itfMes = pagoTotal * itf;
      flujo.push(- (pagoTotal + itfMes)); // egreso del cliente
      // saldo no cambia
    } else if (graciaTipo === "total") {
      // sin pagos; interés se capitaliza
      const pagaSeguro = cobraSeguroEnGraciaTotal ? seguroMes : 0;
      if (pagaSeguro > 0) {
        itfMes = pagaSeguro * itf;
        flujo.push(- (pagaSeguro + itfMes));
      } else {
        flujo.push(0);
      }
      saldo = saldo + interes; // capitalización de intereses
    } else {
      // "sin": no debería entrar aquí en la etapa de gracia
    }

    rows.push({
      mes: m, cuota: 0, interes, amortizacion: amort, seguro: seguroMes,
      itf: itfMes, cuotaTotal: pagoTotal + itfMes, saldo
    });
  }

  // === Cuota francesa después de gracia ===
  const rem = nMeses - graciaMeses;
  const pagoConstante = rem > 0 ? cuotaFrancesa(saldo, iMensual, rem) : 0;

  for (let k = 1; k <= rem; k++) {
    const mes = graciaMeses + k;
    const interes = saldo * iMensual;
    let amort = pagoConstante - interes;
    if (amort < 0) amort = 0; // por seguridad numérica
    const seguroMes = calcSeguro(seguro, saldo, iMensual);
    const itfMes = (pagoConstante + seguroMes) * itf;
    const pagoTotal = pagoConstante + seguroMes + itfMes;

    saldo = saldo - amort;

    rows.push({
      mes, cuota: pagoConstante, interes, amortizacion: amort,
      seguro: seguroMes, itf: itfMes, cuotaTotal: pagoTotal, saldo
    });
    flujo.push(-pagoTotal); // egreso mes a mes
  }

  const totInteres = rows.reduce((a, r) => a + r.interes, 0);
  const totSeguros = rows.reduce((a, r) => a + r.seguro, 0);
  const totITF = rows.reduce((a, r) => a + r.itf, 0);

  // TIR/TCEA (puede no existir si no hay cambio de signo en flujo)
  let tirMensual: number | null = null, tcea: number | null = null;
  try {
    const r = irr(flujo, 0.01);
    if (Number.isFinite(r)) {
      tirMensual = r;
      tcea = toEffectiveAnnualFromMonthly(r);
    }
  } catch { /* noop */ }

  const vanMensual = npv(input.iMensual, flujo);

  return {
    rows,
    desembolsoNeto,
    pagoConstante,
    Pfinanciado: rows.length ? rows[rows.length - rem]?.saldo ?? principal : principal,
    totInteres, totSeguros, totITF,
    flujo,
    tirMensual,
    tcea,
    vanMensual
  };
}

/* ---------- helpers ---------- */

function cuotaFrancesa(P: number, i: number, n: number) {
  if (n <= 0) return 0;
  if (i <= 0) return P / n;
  const f = Math.pow(1 + i, n);
  return (P * i * f) / (f - 1);
}

function calcSeguro(seguro: SeguroDesgravamen, saldo: number, iMensual: number): number {
  if (seguro.mode === "fijo") return seguro.monto;
  // porcentaje
  const base = seguro.base === "saldo_promedio" ? (saldo + Math.max(0, saldo - saldo * iMensual)) / 2 : saldo;
  return base * seguro.tasaMensual;
}
