export type TipoTasa = "TEA" | "TNA";

/** Convierte la tasa ingresada (TEA o TNA con capitalización m) a tasa mensual i */
export function toMonthlyRate(tipo: TipoTasa, tasa: number, mCap: number = 12): number {
  if (tipo === "TEA") return Math.pow(1 + tasa, 1 / 12) - 1;
  // TNA con capitalización mCap por año:
  const iea = Math.pow(1 + tasa / mCap, mCap) - 1; // efectiva anual equivalente
  return Math.pow(1 + iea, 1 / 12) - 1;
}

export function toEffectiveAnnualFromMonthly(im: number): number {
  return Math.pow(1 + im, 12) - 1;
}
