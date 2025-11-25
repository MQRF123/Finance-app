import React, { useMemo } from "react";
import { useFormContext } from "react-hook-form";
import { FormVals } from "@/lib/simulacion/types";
import { toNumber, toInt, preventMinus, blurOnWheel } from "@/lib/simulacion/utils";
import { BANCOS_PERU } from "@/lib/simulacion/data/bancos";

interface Paso2FinanciamientoProps {
  goBack: () => void;
  onCalcular: () => void;
  hoy: string;
}

const INPUT =
  "w-full rounded-xl border px-3 py-2 bg-white focus:outline-none focus:ring-2 ring-emerald-200";

const LABEL = "text-sm";
const ROW = "grid md:grid-cols-2 gap-3";

export function Paso2Financiamiento({
  goBack,
  onCalcular,
  hoy,
}: Paso2FinanciamientoProps) {
  const { register, watch, setValue } = useFormContext<FormVals>();

  const teaIngresada = watch('tasaValor');

  const bancosDisponibles = useMemo(() => {
    const teaPercentage = teaIngresada * 100;
    if (isNaN(teaPercentage)) return [];
    return BANCOS_PERU.filter(banco => teaPercentage >= banco.teaMin && teaPercentage <= banco.teaMax);
  }, [teaIngresada]);

  const handleBancoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedBankId = e.target.value;
    const banco = BANCOS_PERU.find(b => b.id === selectedBankId);
    if (banco) {
      setValue('tasaDesgravamenMensual', banco.desgravamenMensual, { shouldValidate: true });
    }
  };

  return (
    <>
      <div className="text-sm text-emerald-900 font-medium">
        Paso 2: Financiamiento y condiciones
      </div>
      <div className="rounded-2xl border bg-white p-4 space-y-5">
        {/* Tasa y plazo */}
        <div className={ROW}>
          <label className={LABEL}>
            Tasa Efectiva Anual (TEA)
            <input
              type="number"
              min={0}
              step="0.0001"
              className={INPUT}
              placeholder="Ej: 0.10 para 10%"
              onWheel={blurOnWheel}
              onKeyDown={preventMinus}
              {...register("tasaValor", { setValueAs: (v) => toNumber(v, 0) })}
            />
          </label>

          <label className={LABEL}>
            Banco sugerido (según TEA)
            <select
              className={INPUT}
              onChange={handleBancoChange}
              defaultValue=""
            >
              <option value="" disabled>
                {bancosDisponibles.length > 0 ? 'Selecciona un banco' : 'Ningún banco coincide con esta tasa'}
              </option>
              {bancosDisponibles.map((banco) => (
                <option key={banco.id} value={banco.id}>
                  {banco.nombre}
                </option>
              ))}
            </select>
          </label>

          <label className={LABEL}>
            Plazo (meses)
            <input
              type="number"
              min={1}
              step={1}
              className={INPUT}
              onWheel={blurOnWheel}
              onKeyDown={preventMinus}
              {...register("plazoMeses", { setValueAs: (v) => toInt(v, 1) })}
            />
          </label>

          <label className={LABEL}>
            Periodo de gracia
            <select className={INPUT} {...register("tipoGracia")}>
              <option value="sin">Sin gracia</option>
              <option value="total">Total</option>
              <option value="parcial">Parcial</option>
            </select>
          </label>

          <label className={LABEL}>
            Meses de gracia
            <input
              type="number"
              min={0}
              step={1}
              className={INPUT}
              onWheel={blurOnWheel}
              onKeyDown={preventMinus}
              {...register("mesesGracia", { setValueAs: (v) => toInt(v, 0) })}
            />
          </label>

          <label className={LABEL}>
            Administración inicial (S/)
            <input
              type="number"
              min={0}
              className={INPUT}
              onWheel={blurOnWheel}
              onKeyDown={preventMinus}
              {...register("adminInicial", { setValueAs: (v) => toNumber(v, 0) })}
            />
          </label>

          <label className={LABEL}>
            Cuota inicial (S/)
            <input
              type="number"
              min={0}
              className={INPUT}
              onWheel={blurOnWheel}
              onKeyDown={preventMinus}
              {...register("cuotaInicial", { setValueAs: (v) => toNumber(v, 0) })}
            />
          </label>
        </div>

        {/* Costos & Seguros (del Word) */}
        <div>
          <div className="text-sm font-medium text-emerald-900 mb-2">Costos & seguros</div>
          <div className={ROW}>
            <label className={LABEL}>
              Tasa desgravamen mensual (proporción)
              <input
                type="number"
                min={0}
                step="0.0001"
                placeholder="Ej. 0.0035 = 0.35%"
                className={`${INPUT} bg-gray-100`}
                onWheel={blurOnWheel}
                onKeyDown={preventMinus}
                readOnly
                {...register("tasaDesgravamenMensual", { setValueAs: (v) => toNumber(v, 0) })}
              />
            </label>

            <label className={LABEL}>
              Base del seguro de desgravamen
              <select className={INPUT} {...register("baseSeguroDesgravamen")}>
                <option value="saldo">Saldo del periodo</option>
                <option value="saldo_promedio">Saldo promedio del periodo</option>
              </select>
            </label>

            <label className={LABEL}>
              Gastos notariales (S/)
              <input
                type="number"
                min={0}
                className={INPUT}
                onWheel={blurOnWheel}
                onKeyDown={preventMinus}
                {...register("gastosNotariales", { setValueAs: (v) => toNumber(v, 0) })}
              />
            </label>

            <label className={LABEL}>
              Gastos registrales (S/)
              <input
                type="number"
                min={0}
                className={INPUT}
                onWheel={blurOnWheel}
                onKeyDown={preventMinus}
                {...register("gastosRegistrales", { setValueAs: (v) => toNumber(v, 0) })}
              />
            </label>

            <label className={LABEL}>
              Tasación por perito (S/)
              <input
                type="number"
                min={0}
                className={INPUT}
                onWheel={blurOnWheel}
                onKeyDown={preventMinus}
                {...register("tasacionPerito", { setValueAs: (v) => toNumber(v, 0) })}
              />
            </label>

            <label className={`${LABEL} flex items-center gap-2`}>
              <input type="checkbox" {...register("financiarGastos")} />
              <span>Financiar gastos</span>
            </label>

            <label className={LABEL}>
              Fecha de inicio
              <input
                type="date"
                min={hoy}
                className={INPUT}
                {...register("fechaInicio")}
              />
            </label>
          </div>
          <p className="text-xs text-neutral-600 mt-2">
            ITF aplicado en cuotas: 0.005% sobre (cuota financiera + seguro del periodo).
          </p>
        </div>

        <div className="flex justify-between pt-2">
          <button onClick={goBack} className="rounded-lg border px-4 py-2 text-sm">
            Anterior
          </button>
          <button onClick={onCalcular} className="rounded-lg bg-emerald-700 text-white px-4 py-2 text-sm">
            Calcular
          </button>
        </div>
      </div>
    </>
  );
}
