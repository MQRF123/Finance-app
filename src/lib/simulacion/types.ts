// src/types/simulacion.ts
import type { Timestamp } from "firebase/firestore";


export type Estado = "Aprobado" | "Rechazado" | "En proceso" | undefined;
export type TipoTasa = "TEA";
export type GraceType = "sin" | "parcial" | "total";
export type TipoGracia = "sin" | "total" | "parcial";
export type BaseSeguro = "saldo" | "saldo_promedio";

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
  id: string;            // id local (asignado al leer el doc)
  userId?: string;            // dueño del doc (auth.uid)
  clienteId?: string | null;
  unidadId?: string | null;
  entidadId?: string | null;
  monto: number;
  nombre?: string;
  estado?: Estado;


  tasaValor: number;            // p.ej., 0.10 = 10%
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

  // Raw form values
  form?: FormVals;
}

export type FormVals = {
  // Paso 1 (Vivienda / selección)
  tipoInmueble: "Casa" | "Departamento" | "Terreno" | "Otro";
  departamento: string;
  proyecto: string;
  precioVenta: number;
  moneda: "S/" | "$";

  // Paso 2 (Financiamiento y condiciones)
  
  tasaValor: number;        // proporción (0.10 = 10% anual TEA)
  plazoMeses: number;       // mínimo 1
  tipoGracia: TipoGracia;
  mesesGracia: number;      // >= 0 y < plazoMeses
  adminInicial: number;     // pago único
  cuotaInicial: number;

  // Costos & Seguros (del Word)
  tasaDesgravamenMensual: number;   // proporción mensual (p.ej. 0.0035 = 0.35%)
  baseSeguroDesgravamen: BaseSeguro;
  gastosNotariales: number;
  gastosRegistrales: number;
  tasacionPerito: number;
  financiarGastos: boolean;
  fechaInicio: string;              // "yyyy-mm-dd"

  // Bonos (Bono Verde auto por eco, BTP seleccionable)
  bonoVerde: boolean;        // autogestionado (eco)
  bonoVerdeMonto: number;    // (por definir reglas)

  // (no visibles ahora) BBP reservado
  bbp?: boolean;
  bbpMonto?: number;
};

export type Casa = {
  id: string;
  titulo: string;
  precio: number; // S/
  m2: number;
  eco: boolean;
  distrito: string;
};

export interface SimulationSummary {
  precioVenta: number;
  cuotaInicial: number;
  bonos: number;
  principalFinanciado: number;
  tasaValor: number;
  iMensual: number;
  tipoGracia: TipoGracia;
  mesesGracia: number;
  pagoGracia: number;
  pagoRegular: number;
  mesesAmort: number;
  seguroMes1: number;
  itfMes1: number;
  cuotaBase: number;
  eco: boolean;
  totalGastos: number;
  financiarGastos: boolean;
  fechaInicio: string;
  baseSeguroDesgravamen: BaseSeguro;
  tasaDesgravamenMensual: number;
}