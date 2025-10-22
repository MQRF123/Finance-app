import jsPDF from "jspdf";

export function exportarSimulacionPDF(sim: any) {
  const doc = new jsPDF();
  doc.text("Simulación MiVivienda", 14, 16);
  doc.text(`Nombre: ${sim?.nombre ?? "-"}`, 14, 26);
  if (sim?.tcea != null) doc.text(`TCEA: ${(sim.tcea * 100).toFixed(2)}%`, 14, 36);
  return doc;
}
