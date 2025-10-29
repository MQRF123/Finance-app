import React from "react";
import { FormProvider, UseFormReturn } from "react-hook-form";
import { FormVals, Casa } from "@/lib/simulacion/types";
import { SimulacionSidebar } from "./SimulacionSidebar";
import { Paso1Vivienda } from "./Paso1Vivienda";
import { Paso2Financiamiento } from "./Paso2Financiamiento";
import { Paso3Resultados } from "./Paso3Resultados";

interface SimulacionFormProps {
  form: UseFormReturn<FormVals>;
  step: 1 | 2 | 3;
  casas: Casa[];
  selCasa: string | null;
  setSelCasa: (id: string | null) => void;
  goNext: () => void;
  goBack: () => void;
  onCalcular: () => void;
  onGuardar: () => Promise<void>;
  msg: string;
  setStep: (s: 1 | 2 | 3) => void;
  hoy: string;
  pagoRegular: number;
  principalFinanciado: number;
  mesesAmort: number;
  iMensualPct: number;
  pagoGracia: number;
  cuotaBase: number;
  seguroMes1: number;
  itfMes1: number;
  totalGastos: number;
}

export function SimulacionForm({
  form,
  step,
  casas,
  selCasa,
  setSelCasa,
  goNext,
  goBack,
  onCalcular,
  onGuardar,
  msg,
  setStep,
  hoy,
  pagoRegular,
  principalFinanciado,
  mesesAmort,
  iMensualPct,
  pagoGracia,
  cuotaBase,
  seguroMes1,
  itfMes1,
  totalGastos,
}: SimulacionFormProps) {
  return (
    <FormProvider {...form}>
      <div className="grid lg:grid-cols-[280px_1fr] gap-5">
        <SimulacionSidebar step={step} />

        {/* Contenido */}
        <section className="space-y-4">
          <h1 className="text-xl font-semibold">Nueva simulación</h1>

          {step === 1 && (
            <Paso1Vivienda
              casas={casas}
              selCasa={selCasa}
              setSelCasa={setSelCasa}
              goNext={goNext}
              msg={msg}
            />
          )}

          {step === 2 && (
            <Paso2Financiamiento goBack={goBack} onCalcular={onCalcular} hoy={hoy} />
          )}

          {step === 3 && (
            <Paso3Resultados
              goBack={goBack}
              onGuardar={onGuardar}
              msg={msg}
              setStep={setStep}
              pagoRegular={pagoRegular}
              principalFinanciado={principalFinanciado}
              mesesAmort={mesesAmort}
              iMensualPct={iMensualPct}
              pagoGracia={pagoGracia}
              cuotaBase={cuotaBase}
              seguroMes1={seguroMes1}
              itfMes1={itfMes1}
              totalGastos={totalGastos}
            />
          )}

          {msg && step !== 3 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              {msg}
            </div>
          )}
        </section>
      </div>
    </FormProvider>
  );
}