import React, { useMemo } from "react";
import { useFormContext } from "react-hook-form";
import { FormVals } from "@/lib/simulacion/types";
import { toNumber, toInt, preventMinus, blurOnWheel } from "@/lib/simulacion/utils";
import { BANCOS_PERU } from "@/lib/simulacion/data/bancos"; // Asegúrate de tener este archivo creado

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

  // 1. Observar la TEA ingresada en tiempo real
  const teaIngresada = watch("tasaValor");

  // 2. Filtrar bancos disponibles
  const bancosDisponibles = useMemo(() => {
    const tea = Number(teaIngresada);
    if (!tea) return [];
    // Filtramos bancos donde la TEA esté dentro de su rango
    return BANCOS_PERU.filter((b) => tea >= b.teaMin && tea <= b.teaMax);
  }, [teaIngresada]);

  // 3. Manejar selección de banco
  const handleBancoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const bancoId = e.target.value;
    const banco = BANCOS_PERU.find((b) => b.id === bancoId);
    if (banco) {
      // Actualizar el seguro automáticamente (sin dividir, el input espera 0.028)
      // Asumimos que en bancos.ts el seguro está guardado como 0.028
      setValue("tasaDesgravamenMensual", banco.desgravamenMensual);
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
          <div className="space-y-2">
            <label className={LABEL}>
              Tasa Efectiva Anual (TEA) %
              <input
                type="number"
                min={0}
                step="0.01"
                className={INPUT}
                placeholder="Ej: 9.5 para 9.5%"
                onWheel={blurOnWheel}
                onKeyDown={preventMinus}
                {...register("tasaValor", { setValueAs: (v) => toNumber(v, 0) })}
              />
            </label>
            
            {/* --- SELECTOR DE BANCOS INTELIGENTE --- */}
            {teaIngresada > 0 && (
              <div className="bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                <label className="text-xs text-emerald-700 font-medium mb-1 block">
                  Bancos sugeridos para {teaIngresada}% TEA:
                </label>
                <select 
                  className="w-full text-sm p-2 rounded border border-emerald-200 bg-white"
                  onChange={handleBancoChange}
                  defaultValue=""
                >
                  <option value="" disabled>-- Selecciona para aplicar seguro --</option>
                  {bancosDisponibles.length > 0 ? (
                    bancosDisponibles.map((banco) => (
                      <option key={banco.id} value={banco.id}>
                        {banco.nombre} (Seguro: {banco.desgravamenMensual}%)
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>No hay bancos con esta tasa exacta</option>
                  )}
                </select>
              </div>
            )}
          </div>

          <div className="space-y-2">
             <label className={LABEL}>
              Tasa de Descuento / COK (%)
              <input
                type="number"
                min={0}
                step="0.01"
                className={INPUT}
                placeholder="Ej: 20 para 20%"
                onWheel={blurOnWheel}
                onKeyDown={preventMinus}
                {...register("cokValor", { setValueAs: (v) => toNumber(v, 0) })}
              />
            </label>
            <p className="text-xs text-gray-500">
              Tasa de oportunidad. Si es mayor a la TEA, el VAN será positivo.
            </p>
          </div>

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

        {/* Costos & Seguros */}
        <div>
          <div className="text-sm font-medium text-emerald-900 mb-2">Costos & seguros</div>
          <div className={ROW}>
            <label className={LABEL}>
              Tasa desgravamen mensual (%)
              <input
                type="number"
                min={0}
                step="0.0001"
                placeholder="Ej. 0.028 para 0.028%"
                className={INPUT}
                onWheel={blurOnWheel}
                onKeyDown={preventMinus}
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

            {/* ... (Resto de inputs de gastos notariales, etc. se mantienen igual) ... */}
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