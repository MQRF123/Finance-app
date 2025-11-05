import React from "react";
import { useFormContext } from "react-hook-form";
import { FormVals } from "@/lib/simulacion/types";
import { fmtMoney } from "@/lib/simulacion/utils";

interface Paso3ResultadosProps {
  goBack: () => void;
  onGuardar: () => Promise<void>;
  msg: string;
  setStep: (s: 1 | 2 | 3) => void;
  pagoRegular: number;
  principalFinanciado: number;
  mesesAmort: number;
  iMensualPct: number;
  pagoGracia: number;
  cuotaBase: number;
  seguroMes1: number;
  itfMes1: number;
  totalGastos: number;
  tcea: number;
}

export function Paso3Resultados({
  goBack,
  onGuardar,
  msg,
  setStep,
  pagoRegular,
  principalFinanciado,
  mesesAmort,
  iMensualPct,
  pagoGracia,
  cuotaBase,
  seguroMes1,
  itfMes1,
  totalGastos,
  tcea,
}: Paso3ResultadosProps) {
  const { watch } = useFormContext<FormVals>();
  const currentVals = watch(); // Use currentVals to avoid prop drilling issues if vals is not updated

  return (
    <>
      <div className="text-sm text-emerald-900 font-medium">Resultados</div>
      <div className="rounded-2xl border bg-white p-4 space-y-4">
        <div className="max-w-md mx-auto rounded-xl border bg-emerald-50">
          <div className="rounded-t-xl bg-emerald-700 text-white text-center py-2 font-semibold">
            Resultados
          </div>
          <div className="p-4 space-y-3">
            <div className="text-center py-2">
              <div className="text-xs text-neutral-600">
                (Estimado con seguro/ITF del primer mes)
              </div>
              <div className="text-3xl font-bold text-emerald-800">
                {fmtMoney(pagoRegular, currentVals.moneda)}
              </div>
              <div className="text-sm text-neutral-700">Pago mensual (aprox.)</div>
            </div>

            <div className="bg-white rounded-lg border p-3 text-sm space-y-1">
              <div className="flex justify-between">
                <span>Precio de venta</span>
                <span>{fmtMoney(currentVals.precioVenta, currentVals.moneda)}</span>
              </div>
              <div className="flex justify-between">
                <span>Cuota inicial</span>
                <span>{fmtMoney(currentVals.cuotaInicial, currentVals.moneda)}</span>
              </div>
              <div className="flex justify-between">
                <span>Bonos</span>
                <span>
                  {fmtMoney(
                    (currentVals.bonoVerde ? currentVals.bonoVerdeMonto : 0) +
                      (currentVals.bbp ? currentVals.bbpMonto ?? 0 : 0),
                    currentVals.moneda
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Gastos {currentVals.financiarGastos ? "(financiados)" : "(no financiados)"}</span>
                <span>{fmtMoney(totalGastos, currentVals.moneda)}</span>
              </div>
              <div className="flex justify-between">
                <span>Principal financiado</span>
                <span>{fmtMoney(principalFinanciado, currentVals.moneda)}</span>
              </div>
              <div className="flex justify-between">
                <span>Plazo</span>
                <span>{mesesAmort} meses</span>
              </div>
              <div className="flex justify-between">
                <span>Tasa</span>
                <span>
                  {(tcea * 100).toFixed(2)}% TCEA
                </span>
              </div>
              <div className="flex justify-between">
                <span>i mensual</span>
                <span>{iMensualPct.toFixed(4)}%</span>
              </div>
              {currentVals.tipoGracia !== "sin" && currentVals.mesesGracia > 0 && (
                <div className="flex justify-between">
                  <span>Pago durante gracia</span>
                  <span>{fmtMoney(pagoGracia, currentVals.moneda)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Cuota financiera (sin seguro/ITF)</span>
                <span>{fmtMoney(cuotaBase, currentVals.moneda)}</span>
              </div>
              <div className="flex justify-between">
                <span>Seguro desgravamen (mes 1)</span>
                <span>{fmtMoney(seguroMes1, currentVals.moneda)}</span>
              </div>
              <div className="flex justify-between">
                <span>ITF (mes 1)</span>
                <span>{fmtMoney(itfMes1, currentVals.moneda)}</span>
              </div>
              <div className="flex justify-between">
                <span>Ecofriendly</span>
                <span>{currentVals.bonoVerde ? "Sí (Bono Verde aplicable)" : "No"}</span>
              </div>

              <div className="flex justify-between">
                <span>Inicio del crédito</span>
                <span>{currentVals.fechaInicio || "—"}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={goBack} className="rounded-lg border px-4 py-2 text-sm w-full">
                Anterior
              </button>
              <button
                onClick={onGuardar}
                className="rounded-lg bg-emerald-700 text-white px-4 py-2 text-sm w-full hover:bg-emerald-800"
              >
                Guardar simulación
              </button>
            </div>

            {msg && <p className="text-xs text-neutral-700">{msg}</p>}
          </div>
        </div>
        <div className="pt-1">
          <button onClick={() => setStep(1)} className="rounded-lg border px-4 py-2 text-sm">
            Volver al inicio
          </button>
        </div>
      </div>
    </>
  );
}
