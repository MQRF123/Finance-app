// src/types/simulacion.ts
import type { Timestamp } from "firebase/firestore";

export type Moneda = "PEN" | "USD";
export type TipoTasa = "TEA" | "TNA";
export type GraceType = "sin" | "parcial" | "total";

export interface Bono {
  nombre: string;
  monto: number;
}

export interface EntidadFinanciera {
  id: string;
  nombre: string;
  base360: boolean;                 // si su TNA se expresa base 360
  cobraSeguroEnGraciaTotal: boolean;
  itf: number;                      // 0.00005
  portesMensuales: number;          // si aplica
  gastosNotariales: number;
  gastosRegistrales: number;
  tasacionPerito: number;
  seguro:
    | { mode: "fijo"; monto: number }
    | { mode: "porcentaje"; tasaMensual: number; base: "saldo" | "saldo_promedio" };
  minPlazo: number;
  maxPlazo: number;
  minTasa: number;
  maxTasa: number;
}

/** Documento de simulación almacenado en Firestore */
export interface Simulacion {
  // Identificación
  id?: string;            // id local (asignado al leer el doc)
  uid: string;            // dueño del doc (auth.uid)
  clienteId?: string | null;
  unidadId?: string | null;
  entidadId?: string | null;

  // Condiciones y parámetros
  moneda: Moneda;
  tipoTasa: TipoTasa;
  tasaValor: number;            // p.ej., 0.10 = 10%
  capitalizacion?: number;      // si TNA (m por año)
  plazoMeses: number;
  graciaTipo: GraceType;
  graciaMeses: number;

  precioVenta: number;
  cuotaInicial: number;
  bonos?: Bono[];               // BTP, BBP, Bono Verde, etc.

  // Costos / comisiones
  itf: number;                  // p.ej., 0.00005 (0.005%)
  costosIniciales?: number;     // suma de costos si ya los consolidas
  gastosNotariales?: number;
  gastosRegistrales?: number;
  tasacionPerito?: number;
  adminInicialSoles?: number;

  // Seguro de desgravamen (opcional)
  seguro?:
    | { mode: "fijo"; monto: number }
    | { mode: "porcentaje"; tasaMensual: number; base: "saldo" | "saldo_promedio" };
  cobraSeguroEnGraciaTotal?: boolean;

  // Resultados calculados
  tcea?: number | null;         // efectiva anual
  tirMensual?: number | null;   // IRR mensual
  vanMensual?: number;          // VAN a tasa mensual de entrada
  totInteres?: number;
  totSeguros?: number;
  totITF?: number;
  desembolsoNeto?: number;
  pagoConstante?: number;       // cuota base post-gracia

  // Timestamps
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}
