import jsPDF from "jspdf";
export function usePDF() {
  return {
    save(text = "MiVivienda") {
      const doc = new jsPDF();
      doc.text(text, 14, 16);
      doc.save("simulacion.pdf");
    }
  };
}
