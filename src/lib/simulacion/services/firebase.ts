import { addDoc, collection, serverTimestamp, getDocs, doc, getDoc, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { type FormVals, type SimulationSummary, type Simulacion } from "@/lib/simulacion/types";

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

export async function getAllSimulaciones(userId: string): Promise<(Simulacion & { id: string })[]> {
  const q = query(collection(db, "simulaciones"), where("userId", "==", userId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Simulacion & { id: string }));
}

export async function getSimulacionById(id: string): Promise<(Simulacion & { id: string }) | null> {
  const docRef = doc(db, "simulaciones", id);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Simulacion & { id: string };
  } else {
    return null;
  }
}
