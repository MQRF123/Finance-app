import { useMemo } from "react";
import { FormVals } from "./types";
import { tasaMensual, ITF } from "./utils";
import { generarPlan, type SimInput, type SeguroDesgravamen } from "@/lib/calculations/schedule";


export function useSimulacionCalculations(vals: FormVals) {
  // Cálculos derivados de `vals`
  const { bonos, totalGastos, principalFinanciado } = useMemo(() => {
    const bonos = (vals.bbp ? vals.bbpMonto ?? 0 : 0) + (vals.bonoVerde ? vals.bonoVerdeMonto ?? 0 : 0);
    const totalGastos = vals.gastosNotariales + vals.gastosRegistrales + vals.tasacionPerito;
    const principalFinanciado = Math.max(
      0,
      vals.precioVenta - vals.cuotaInicial - bonos + (vals.financiarGastos ? totalGastos : 0)
    );
    return { bonos, totalGastos, principalFinanciado };
  }, [vals]);

  const i = useMemo(() => tasaMensual(vals.tasaValor), [vals.tasaValor]);
  const iMensualPct = useMemo(() => i * 100, [i]);

  const plan = useMemo(() => {
    const seguro: SeguroDesgravamen = {
      mode: "porcentaje",
      tasaMensual: vals.tasaDesgravamenMensual,
      base: vals.baseSeguroDesgravamen,
    };

    const input: SimInput = {
      principal: principalFinanciado,
      nMeses: vals.plazoMeses,
      iMensual: i,
      graciaMeses: vals.mesesGracia,
      graciaTipo: vals.tipoGracia,
      itf: ITF,
      seguro,
      costosIniciales: vals.financiarGastos ? 0 : totalGastos,
      cobraSeguroEnGraciaTotal: vals.tipoGracia === "total",
    };

    return generarPlan(input);
  }, [vals, principalFinanciado, totalGastos, i]);

  const { tcea, pagoConstante, seguroMes1, itfMes1, pagoGracia } = useMemo(() => {
    const firstRow = plan.rows[0];
    const seguro1 = firstRow?.seguro ?? 0;
    const itf1 = firstRow?.itf ?? 0;

    return {
      tcea: plan.tcea ?? 0,
      pagoConstante: plan.pagoConstante,
      seguroMes1: seguro1,
      itfMes1: itf1,
      pagoGracia: plan.rows.find(r => r.mes <= vals.mesesGracia)?.cuotaTotal ?? 0,
    };
  }, [plan, vals.mesesGracia]);


  return {
    i,
    iMensualPct,
    tea: tcea,
    pagoGracia,
    pagoRegular: pagoConstante + seguroMes1 + itfMes1, // Aprox
    mesesAmort: vals.plazoMeses - vals.mesesGracia,
    seguroMes1,
    itfMes1,
    cuotaBase: pagoConstante,
    tcea,
    // Devolver estos también
    bonos,
    totalGastos,
    principalFinanciado,
  };
}
