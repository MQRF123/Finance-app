import React from "react";
import { useFormContext, Controller } from "react-hook-form";
import { FormVals, Casa } from "@/lib/simulacion/types";
import { fmtMoney } from "@/lib/simulacion/utils";

interface Paso1ViviendaProps {
  casas: Casa[];
  selCasa: string | null;
  onCasaSelect: (casa: Casa) => void;
  goNext: () => void;
  msg: string;
}

const INPUT =
  "w-full rounded-xl border px-3 py-2 bg-white focus:outline-none focus:ring-2 ring-emerald-200";

const LABEL = "text-sm";
const ROW = "grid md:grid-cols-2 gap-3";

export function Paso1Vivienda({
  casas,
  selCasa,
  onCasaSelect,
  goNext,
  msg,
}: Paso1ViviendaProps) {
  const { register, watch, control } = useFormContext<FormVals>();
  
  // Estrategia final: observar campos individualmente
  const [precioVenta, bbpMonto, bonoVerdeMonto, moneda, bonoVerde] = watch([
    "precioVenta",
    "bbpMonto",
    "bonoVerdeMonto",
    "moneda",
    "bonoVerde"
  ]);

  return (
    <>
      <div className="text-sm text-emerald-900 font-medium">Paso 1: Elige tu vivienda</div>

      {/* --- DEBUG --- */}
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative mb-4" role="alert">
        <strong className="font-bold">Debug Info: </strong>
        <span className="block sm:inline">
          BBP: {bbpMonto ?? 'undefined'} | Verde: {bonoVerdeMonto ?? 'undefined'}
        </span>
      </div>
      {/* --- END DEBUG --- */}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {casas.map((c) => {
          const active = selCasa === c.id;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onCasaSelect(c)}
              className={`text-left rounded-2xl border bg-white p-4 transition ${
                active ? "ring-2 ring-emerald-500 border-emerald-500" : "hover:shadow-sm"}`}
            >
              <div className="flex items-start justify-between">
                <div className="font-medium">{c.titulo}</div>
                {c.eco && (
                  <span className="text-[10px] rounded-full bg-emerald-100 text-emerald-700 px-2 py-1 border border-emerald-200">
                    Ecofriendly
                  </span>
                )}
              </div>
              <div className="mt-2 text-2xl font-bold">{fmtMoney(c.precio, moneda)}</div>
              <div className="text-sm text-neutral-600 mt-1">{c.m2} m² · {c.distrito}</div>
              {active && <div className="text-xs text-emerald-700 mt-2">Seleccionada</div>}
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl border bg-white p-4">
        <div className={ROW}>
          <label className={LABEL}>
            Proyecto seleccionado
            <input className={INPUT} readOnly {...register("proyecto")} />
          </label>

          <label className={LABEL}>
            Precio final (con bonos)
            <Controller
              control={control}
              name="precioVenta"
              render={({ field: { ref, name, onBlur, onChange } }) => (
                <input
                  ref={ref}
                  name={name}
                  onBlur={onBlur}
                  onChange={onChange}
                  type="text"
                  className={`${INPUT} bg-neutral-100`}
                  readOnly
                  tabIndex={-1}
                  value={fmtMoney(
                    precioVenta - ((bbpMonto ?? 0) + (bonoVerdeMonto ?? 0)),
                    moneda
                  )}
                />
              )}
            />
          </label>

          <label className={LABEL}>
            Bono del Buen Pagador (BBP)
            <input
              className={`${INPUT} bg-neutral-100`}
              readOnly
              tabIndex={-1}
              {...register("bbpMonto")}
            />
          </label>

          <label className={LABEL}>
            Bono Verde
            <input
              className={`${INPUT} bg-neutral-100`}
              readOnly
              tabIndex={-1}
              {...register("bonoVerdeMonto")}
            />
          </label>

          <div className={LABEL}>
            Bono Verde aplicable:{" "}
            <span className={`px-2 py-0.5 rounded-full text-xs border ${
              bonoVerde
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-neutral-50 text-neutral-700 border-neutral-200"
            }`}>
              {bonoVerde ? "Sí (vivienda ecofriendly)" : "No"}
            </span>
          </div>
        </div>

        <div className="flex justify-between pt-2">
          <button className="rounded-lg border px-4 py-2 text-sm" disabled>
            Anterior
          </button>
          <button onClick={goNext} className="rounded-lg bg-emerald-700 text-white px-4 py-2 text-sm">
            Siguiente ▸
          </button>
        </div>

        {msg && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 mt-2">
            {msg}
          </div>
        )}
      </div>
    </>
  );
}