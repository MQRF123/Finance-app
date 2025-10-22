import { teaToMensual } from "./tasa";
import { ITF } from "@/config/app";

type Input = {
  principal: number; nMeses: number; tea: number;
  tasaDesgravamenMensual: number;
  baseSeguroDesgravamen: "saldo" | "saldo_promedio";
  gastosNotariales: number; gastosRegistrales: number; tasacionPerito: number;
  itfPorcentaje?: number; financiarGastos: boolean;
  mesesGracia?: number;
  tipoGracia?: "sin" | "parcial" | "total";
};

export function generarCronograma(input: Input) {
  const i = teaToMensual(input.tea);
  const gastos = (input.tasacionPerito || 0) + (input.gastosNotariales || 0) + (input.gastosRegistrales || 0);
  const Pfin = input.financiarGastos ? input.principal + gastos : input.principal;
  const itf = input.itfPorcentaje ?? ITF;
  const mesesGracia = Math.max(0, input.mesesGracia || 0);
  const tipoGracia = input.tipoGracia || "sin";

  let rows: Array<{
    mes: number; cuota: number; interes: number; amortizacion: number;
    seguro: number; itf: number; cuotaTotal: number; saldo: number;
  }> = [];

  // Helper de cuota francesa
  function cuotaFrancesa(P: number, im: number, n: number) {
    if (n <= 0) return 0;
    return P * (im * Math.pow(1 + im, n)) / (Math.pow(1 + im, n) - 1);
  }

  let saldo = Pfin;
  let mes = 0;

  // Fase de gracia (si aplica)
  if (tipoGracia === "total" && mesesGracia > 0) {
    for (let g = 0; g < mesesGracia; g++) {
      mes++;
      const interes = saldo * i;
      // gracia total con capitalización de intereses (sin pagos)
      saldo = saldo + interes;

      const seguro = 0; // sin pagos en total
      const cuota = 0;
      const amortizacion = 0;
      const itf_k = 0;
      const cuotaTotal = 0;

      rows.push({ mes, cuota, interes, amortizacion, seguro, itf: itf_k, cuotaTotal, saldo });
    }
  } else if (tipoGracia === "parcial" && mesesGracia > 0) {
    for (let g = 0; g < mesesGracia; g++) {
      mes++;
      const interes = saldo * i;
      const amortizacion = 0;
      // base del seguro antes de pago (saldo no cambia en parcial)
      const baseSeguro = input.baseSeguroDesgravamen === "saldo" ? saldo : (saldo + saldo) / 2;
      const seguro = baseSeguro * (input.tasaDesgravamenMensual || 0);
      const cuota = interes; // solo intereses
      const itf_k = itf * (cuota + seguro);
      const cuotaTotal = cuota + seguro + itf_k;

      rows.push({ mes, cuota, interes, amortizacion, seguro, itf: itf_k, cuotaTotal, saldo });
    }
  }

  // Resto de meses (sin gracia)
  const resto = input.nMeses - mesesGracia;
  const cuota = cuotaFrancesa(saldo, i, resto);

  for (let k = 0; k < resto; k++) {
    mes++;
    const interes = saldo * i;
    const amortizacion = Math.min(cuota - interes, saldo);
    const saldoSig = Math.max(saldo - amortizacion, 0);

    const baseSeguro = input.baseSeguroDesgravamen === "saldo"
      ? saldo
      : (saldo + saldoSig) / 2;

    const seguro = baseSeguro * (input.tasaDesgravamenMensual || 0);
    const itf_k = itf * (cuota + seguro);
    const cuotaTotal = cuota + seguro + itf_k;

    rows.push({ mes, cuota, interes, amortizacion, seguro, itf: itf_k, cuotaTotal, saldo: saldoSig });
    saldo = saldoSig;
  }

  // Flujos para TCEA
  const desembolsoNeto = input.principal - (input.financiarGastos ? 0 : gastos);
  const flujos = [desembolsoNeto, ...rows.map(r => -r.cuotaTotal)];

  return { rows, cuota, flujos, desembolsoNeto, Pfinanciado: Pfin };
}
