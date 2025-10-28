// src/lib/finance/cronograma.ts
// Wrapper tipado que reutiliza el motor de schedule.ts y evita duplicar lógica.

import { generarPlan } from "./schedule";

export type {
  Row,
  SimInput,
  SimOutput,
  GraceType,
  SeguroDesgravamen,
} from "./schedule";

/**
 * Compatibilidad con código previo:
 * si tenías una función llamada `generarCronograma`, este wrapper delega a `generarPlan`.
 */
export function generarCronograma(input: Parameters<typeof generarPlan>[0]) {
  return generarPlan(input);
}
