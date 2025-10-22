export type Simulacion = {
  id?: string;
  uid: string;
  nombre: string;
  principal: number;
  nMeses: number;
  tea: number;
  tasaDesgravamenMensual: number;
  baseSeguroDesgravamen: "saldo" | "saldo_promedio";
  gastosNotariales: number;
  gastosRegistrales: number;
  tasacionPerito: number;
  itfPorcentaje: number;
  financiarGastos: boolean;
  mesesGracia: number;
  tipoGracia: "sin" | "parcial" | "total";
  tcea?: number | null;
  createdAt?: any;
};
