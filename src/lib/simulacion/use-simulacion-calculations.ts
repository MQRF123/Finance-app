import { useMemo } from "react";
import { FormVals } from "./types";
import { tasaMensual, ITF } from "./utils";

interface SimulacionCalculationsParams {
  vals: FormVals;
  principalFinanciado: number;
}

export function useSimulacionCalculations({
  vals,
  principalFinanciado,
}: SimulacionCalculationsParams) {
  // Tasa mensual efectiva
  const i = useMemo(() => tasaMensual(vals.tasaValor), [vals.tasaValor]);
  const iMensualPct = useMemo(() => i * 100, [i]);
  const tea = useMemo(() => Math.pow(1 + i, 12) - 1, [i]); // aprox de TCEA por ahora

  // Cuota base (sin seguro/ITF), considerando gracia
  // Nota: si gracia total/parcial, capitalizamos o no amortizamos meses de gracia
  const { pagoGracia, pagoRegular, mesesAmort, seguroMes1, itfMes1, cuotaBase } = useMemo(() => {
    const mGr = Math.max(0, Math.min(vals.mesesGracia, vals.plazoMeses - 1));

    // Saldo sobre el que se amortiza después de la gracia
    let P = principalFinanciado;
    if (vals.tipoGracia === "total" && mGr > 0) {
      P = principalFinanciado * Math.pow(1 + i, mGr); // capitaliza interés durante la gracia
    }
    const amortMeses = Math.max(1, vals.plazoMeses - mGr);

    // Cuota base financiera (sin seguro/ITF)
    let C = 0;
    if (i > 0) {
      const f = Math.pow(1 + i, amortMeses);
      C = (P * i * f) / (f - 1);
    } else {
      C = P / amortMeses;
    }

    // Interés del primer mes post-gracia (o mes 1 si sin gracia)
    const interes1 = P * i;
    const amort1 = C - interes1;
    const saldo1 = Math.max(0, P - amort1);

    // Seguro mes 1 según base seleccionada
    const baseSeguro =
      vals.baseSeguroDesgravamen === "saldo"
        ? P
        : (P + saldo1) / 2; // saldo_promedio aprox

    const seguro1 = baseSeguro * Math.max(0, vals.tasaDesgravamenMensual);

    // ITF mes 1 sobre (cuota financiera + seguro)
    const itf1 = ITF * (C + seguro1);

    // Pago durante gracia (si aplica)
    let pagoGr = 0;
    if (vals.tipoGracia === "total" && mGr > 0) {
      // Solo seguro en gracia total (aprox usando P como base)
      const baseG = vals.baseSeguroDesgravamen === "saldo" ? principalFinanciado : principalFinanciado; // aprox
      pagoGr = baseG * Math.max(0, vals.tasaDesgravamenMensual);
    } else if (vals.tipoGracia === "parcial" && mGr > 0) {
      // Interés + seguro
      const baseG = vals.baseSeguroDesgravamen === "saldo" ? principalFinanciado : principalFinanciado; // aprox
      const segG = baseG * Math.max(0, vals.tasaDesgravamenMensual);
      pagoGr = principalFinanciado * i + segG;
    }

    // Pago regular (cuota base + seguro + ITF)
    const pagoReg = C + seguro1 + itf1;

    return {
      pagoGracia: pagoGr,
      pagoRegular: pagoReg,
      mesesAmort: amortMeses,
      seguroMes1: seguro1,
      itfMes1: itf1,
      cuotaBase: C,
    };
  }, [
    vals.mesesGracia,
    vals.plazoMeses,
    vals.tipoGracia,
    vals.baseSeguroDesgravamen,
    vals.tasaDesgravamenMensual,
    principalFinanciado,
    i,
  ]);

  return {
    i,
    iMensualPct,
    tea,
    pagoGracia,
    pagoRegular,
    mesesAmort,
    seguroMes1,
    itfMes1,
    cuotaBase,
  };
}
