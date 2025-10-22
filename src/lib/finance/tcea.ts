import { generarCronograma } from "./cronograma";

function irrMonthly(cashflows: number[], guess = 0.01): number {
  // Newton-Raphson simple con derivada numérica
  let r = guess;
  for (let iter = 0; iter < 100; iter++) {
    let npv = 0, d = 0, denom = 1;
    for (let t = 0; t < cashflows.length; t++) {
      npv += cashflows[t] / denom;
      d += -t * cashflows[t] / denom;
      denom *= (1 + r);
    }
    if (Math.abs(npv) < 1e-12) break;
    const step = npv / d;
    r -= step;
    if (!isFinite(r)) { r = guess; break; }
    if (Math.abs(step) < 1e-12) break;
  }
  return r;
}

export function calcularTCEA(input: any) {
  const { flujos } = generarCronograma(input);
  const irr_m = irrMonthly(flujos, 0.01);
  const tcea = Math.pow(1 + irr_m, 12) - 1;
  return { tcea, irr_m };
}
