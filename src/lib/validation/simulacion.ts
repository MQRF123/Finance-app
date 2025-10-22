import { z } from "zod";

export const simulacionSchema = z.object({
  nombre: z.string().min(1),
  principal: z.number().positive(),
  nMeses: z.number().int().positive(),
  tea: z.number().min(0),
  tasaDesgravamenMensual: z.number().min(0),
  baseSeguroDesgravamen: z.enum(["saldo", "saldo_promedio"]),
  gastosNotariales: z.number().min(0),
  gastosRegistrales: z.number().min(0),
  tasacionPerito: z.number().min(0),
  itfPorcentaje: z.number().min(0),
  financiarGastos: z.boolean(),
  mesesGracia: z.number().int().min(0),
  tipoGracia: z.enum(["sin", "parcial", "total"]),
});
