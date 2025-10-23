// src/lib/utils/format.ts
export function formatMoney(value: number, moneda: "PEN" | "USD", fractionDigits = 2): string {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: moneda === "PEN" ? "PEN" : "USD",
    minimumFractionDigits: fractionDigits,
  }).format(value);
}

export function formatPercent(value: number, fractionDigits = 2): string {
  return `${(value * 100).toFixed(fractionDigits)}%`;
}

export function safeNumber(n: unknown, fallback = 0): number {
  return typeof n === "number" && Number.isFinite(n) ? n : fallback;
}
