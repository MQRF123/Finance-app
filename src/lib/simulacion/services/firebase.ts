import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { type FormVals, type SimulationSummary } from "@/lib/simulacion/types";

interface SaveSimulationParams {
  userId: string;
  tcea: number;
  plazoMeses: number;
  monto: number;
  nombre: string | null;
  estado: string;
  resumen: SimulationSummary;
  form: FormVals;
}

export async function saveSimulation(params: SaveSimulationParams) {
  const { userId, tcea, plazoMeses, monto, nombre, estado, resumen, form } = params;

  await addDoc(collection(db, "simulaciones"), {
    userId,
    createdAt: serverTimestamp(),
    tcea,
    plazoMeses,
    monto,
    nombre,
    estado,
    resumen,
    form,
  });
}
