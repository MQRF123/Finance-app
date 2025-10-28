// src/lib/pdf/simulacion-pdf.ts
import jsPDF from "jspdf";
import autoTable, { type UserOptions } from "jspdf-autotable";

// Tip augmentation para usar lastAutoTable sin any
declare module "jspdf" {
  interface jsPDF {
    lastAutoTable?: { finalY: number };
  }
}

/* ====================== Tipos defensivos ====================== */

export interface PdfKPI {
  label?: string;
  value?: string | number | null | undefined;
}

export interface PdfRow {
  mes?: number | null | undefined;
  cuota?: number | null | undefined;
  interes?: number | null | undefined;
  amortizacion?: number | null | undefined;
  seguro?: number | null | undefined;
  itf?: number | null | undefined;
  cuotaTotal?: number | null | undefined;
  saldo?: number | null | undefined;
}

export interface SimulacionPdfData {
  titulo?: string;
  cliente?: string;
  unidad?: string;
  entidad?: string;
  condiciones?: Array<string | number | null | undefined>;
  kpis?: PdfKPI[];
  rows?: PdfRow[];
  moneda?: "PEN" | "USD";
}

/* ====================== Helpers ====================== */

function S(v: unknown, fallback = ""): string {
  if (v === null || v === undefined) return fallback;
  return String(v);
}

function N(v: unknown, fallback = 0): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

function money(v: unknown, moneda: "PEN" | "USD"): string {
  const n = N(v, 0);
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: moneda === "USD" ? "USD" : "PEN",
    minimumFractionDigits: 2,
  }).format(n);
}

/* ====================== Generador de PDF ====================== */

/**
 * Genera el PDF de la simulación.
 * Devuelve la instancia jsPDF para que puedas `doc.save("reporte.pdf")` donde lo llames.
 */
export function buildSimulacionPDF(data: SimulacionPdfData): jsPDF {
  const doc = new jsPDF();
  const moneda: "PEN" | "USD" = data.moneda === "USD" ? "USD" : "PEN";

  // Header
  doc.setFont("helvetica", "normal"); // <- evitar undefined
  doc.setFontSize(14);
  doc.text(S(data.titulo, "Simulación de Crédito MiVivienda"), 14, 16);

  doc.setFontSize(10);
  doc.text(`Cliente: ${S(data.cliente, "—")}`, 14, 24);
  doc.text(`Unidad: ${S(data.unidad, "—")}`, 14, 30);
  doc.text(`Entidad: ${S(data.entidad, "—")}`, 14, 36);

  // Condiciones
  let y = 44;
  doc.setFont("helvetica", "bold");   // <- evitar undefined
  doc.text("Condiciones de la operación", 14, y);
  doc.setFont("helvetica", "normal"); // <- evitar undefined
  y += 6;

  (data.condiciones ?? [])
    .filter((line) => line !== null && line !== undefined && S(line).length > 0)
    .forEach((line) => {
      doc.text(`• ${S(line)}`, 16, y);
      y += 5;
    });

  // KPIs
  y += 2;
  doc.setFont("helvetica", "bold");
  doc.text("Indicadores", 14, y);
  doc.setFont("helvetica", "normal");
  y += 4;

  const kpiHead: UserOptions["head"] = [["Indicador", "Valor"]];
  const kpiBody: UserOptions["body"] = (data.kpis ?? []).map((k) => [
    S(k.label, "—"),
    S(k.value, "—"),
  ]);

  autoTable(doc, {
    head: kpiHead,
    body: kpiBody,
    startY: y,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [25, 135, 84] }, // verde
    margin: { left: 14, right: 14 },
  });

  // Cronograma
  const afterKPIsY = doc.lastAutoTable?.finalY ?? y + 20;

  doc.setFont("helvetica", "bold");
  doc.text("Cronograma de pagos (método francés vencido)", 14, afterKPIsY + 10);
  doc.setFont("helvetica", "normal");

  const cronHead: UserOptions["head"] = [
    ["Mes", "Cuota", "Interés", "Amortización", "Seguro", "ITF", "Total", "Saldo"],
  ];

  const cronBody: UserOptions["body"] = (data.rows ?? []).map((r) => [
    S(N(r.mes, 0)),                // Mes como string
    money(r.cuota, moneda),
    money(r.interes, moneda),
    money(r.amortizacion, moneda),
    money(r.seguro, moneda),
    money(r.itf, moneda),
    money(r.cuotaTotal, moneda),
    money(r.saldo, moneda),
  ]);

  autoTable(doc, {
    head: cronHead,
    body: cronBody,
    startY: afterKPIsY + 14,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [25, 135, 84] },
    margin: { left: 14, right: 14 },
  });

  return doc;
}
