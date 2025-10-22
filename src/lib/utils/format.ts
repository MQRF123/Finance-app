export const fmtMoney = (v: number, c = "es-PE") => new Intl.NumberFormat(c, { style: "currency", currency: "PEN" }).format(v ?? 0);
export const fmtPct = (v: number, c = "es-PE") => `${((v ?? 0) * 100).toFixed(2)}%`;
