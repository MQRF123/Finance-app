
import { type DocumentData, type QueryDocumentSnapshot, Timestamp } from 'firebase/firestore';
import { type Simulacion, type GraceType, type Bono } from './types';

/** Convierte un doc a Simulacion de forma segura */
export function toSimulacion(d: QueryDocumentSnapshot<DocumentData>): Simulacion {
  const data = d.data();
  const createdAt = data.createdAt instanceof Timestamp
    ? data.createdAt
    : typeof data.createdAt === 'number'
      ? Timestamp.fromDate(new Date(data.createdAt))
      : Timestamp.fromDate(new Date()); // fallback

  return {
    id: d.id,
    userId: String(data.userId ?? ''),
    createdAt,
    tcea: Number(data.tcea ?? 0),
    plazoMeses: Number(data.plazoMeses ?? 0),
    monto: Number(data.monto ?? 0),

    nombre: typeof data.nombre === 'string' ? data.nombre : undefined,
    estado: typeof data.estado === 'string' ? (data.estado as Simulacion['estado']) : undefined,

    tasaValor: Number(data.tasaValor ?? 0),
    graciaTipo: data.graciaTipo as GraceType,
    graciaMeses: Number(data.graciaMeses ?? 0),
    precioVenta: Number(data.precioVenta ?? 0),
    cuotaInicial: Number(data.cuotaInicial ?? 0),
    bonos: data.bonos as Bono[],
    itf: Number(data.itf ?? 0),
    gastosNotariales: Number(data.gastosNotariales ?? 0),
    gastosRegistrales: Number(data.gastosRegistrales ?? 0),
    tasacionPerito: Number(data.tasacionPerito ?? 0),
    adminInicialSoles: Number(data.adminInicialSoles ?? 0),
    seguro: data.seguro,
    cobraSeguroEnGraciaTotal: data.cobraSeguroEnGraciaTotal ?? false,
    tirMensual: Number(data.tirMensual ?? 0),
    vanMensual: Number(data.vanMensual ?? 0),
    totInteres: Number(data.totInteres ?? 0),
    totSeguros: Number(data.totSeguros ?? 0),
    totITF: Number(data.totITF ?? 0),
    desembolsoNeto: Number(data.desembolsoNeto ?? 0),
    pagoConstante: Number(data.pagoConstante ?? 0),
    form: data.form,
  };
}

/** Helper: formatea moneda */
export function fmtMoney(v: number, currency: "S/" | "$" = "S/") {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: currency === "S/" ? "PEN" : "USD",
    minimumFractionDigits: 2,
  }).format(v);
}

export function fmtDate(t: Timestamp | Date) {
  const d = t instanceof Timestamp ? t.toDate() : t;
  return new Intl.DateTimeFormat('es-PE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

// Números seguros >= min
export const toNumber = (v: unknown, min = 0) => {
  if (typeof v === "number") return Math.max(min, Number.isFinite(v) ? v : 0);
  if (typeof v === "string") {
    const n = parseFloat(v.replace(",", "."));
    return Math.max(min, Number.isFinite(n) ? n : 0);
  }
  return min;
};
export const toInt = (v: unknown, min = 0) => Math.max(min, Math.floor(toNumber(v, min)));

// Bloquear '-', '+', 'e', 'E' en number
export const preventMinus = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (e.key === "-" || e.key === "+" || e.key === "e" || e.key === "E") e.preventDefault();
};
// Evitar scroll para cambiar número
export const blurOnWheel = (e: React.WheelEvent<HTMLInputElement>) => {
  (e.currentTarget as HTMLInputElement).blur();
};

export function tasaMensual(v: number) {
  const vPos = Math.max(0, v);
  return Math.pow(1 + vPos, 1 / 12) - 1;
}

// ITF 0.005% (del Word)
export const ITF = 0.00005;

