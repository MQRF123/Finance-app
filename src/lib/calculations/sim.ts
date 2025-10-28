import { toMonthlyRate } from "./rates";
import { generarPlan, SimInput, SeguroDesgravamen, SimOutput } from "./schedule";

export interface Bono { nombre: string; monto: number; }
export interface SimRequest {
  moneda: "PEN" | "USD";
  tipoTasa: "TEA" | "TNA";
  tasaValor: number;       // p.ej. 0.10
  capitalizacion?: number; // si TNA
  plazoMeses: number;
  graciaTipo: "sin" | "parcial" | "total";
  graciaMeses: number;

  precioVenta: number;
  cuotaInicial: number;

  bonos?: Bono[];          // incluye BTP, BBP, Bono Verde…
  itf: number;             // 0.00005 (0.005%)
  costosIniciales: number; // notariales, registrales, tasación, etc.

  // seguro
  seguro: SeguroDesgravamen;

  cobraSeguroEnGraciaTotal?: boolean;
}

export interface SimResponse extends SimOutput {
  principalFinanciado: number;
}

export function simular(req: SimRequest): SimResponse {
  const {
    tipoTasa, tasaValor, capitalizacion = 12,
    plazoMeses, graciaMeses, graciaTipo,
    precioVenta, cuotaInicial, bonos = [],
    itf, costosIniciales, seguro, cobraSeguroEnGraciaTotal,
  } = req;

  const bonosTotal = bonos.reduce((a, b) => a + (b?.monto || 0), 0);
  const principal = Math.max(0, precioVenta - cuotaInicial - bonosTotal);

  const iMensual = toMonthlyRate(tipoTasa, tasaValor, capitalizacion);

  const out = generarPlan({
    principal,
    nMeses: plazoMeses,
    iMensual,
    graciaMeses,
    graciaTipo,
    itf,
    seguro,
    costosIniciales,
    cobraSeguroEnGraciaTotal,
  } as SimInput);

  return {
    ...out,
    principalFinanciado: principal,
  };
}
