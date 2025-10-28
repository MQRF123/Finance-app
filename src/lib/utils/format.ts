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

export function formatDate(date: { seconds: number } | undefined) {
  if (!date) return "Fecha no disponible";

  const timestamp = date.seconds * 1000;
  const now = new Date();
  const dateObj = new Date(timestamp);

  // Si es hoy
  if (dateObj.toDateString() === now.toDateString()) {
    return "Hoy";
  }

  // Si es ayer
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (dateObj.toDateString() === yesterday.toDateString()) {
    return "Ayer";
  }

  // Si es esta semana
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);
  if (dateObj > weekAgo) {
    const days = [
      "Domingo",
      "Lunes",
      "Martes",
      "Miércoles",
      "Jueves",
      "Viernes",
      "Sábado",
    ];
    return days[dateObj.getDay()];
  }

  // Si es este año
  if (dateObj.getFullYear() === now.getFullYear()) {
    return dateObj.toLocaleDateString("es-PE", {
      day: "numeric",
      month: "long",
    });
  }

  // Si es de otro año
  return dateObj.toLocaleDateString("es-PE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}