"use client";

import { useMemo, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check } from "lucide-react";
import { schema, defaultVals, type FormValues } from "./form-schema";

/** 👇 Cast único para garantizar que el resolver y useForm usen EXACTAMENTE el mismo tipo */
const resolver = zodResolver(schema) as unknown as Resolver<FormValues>;

const INPUT_CLS =
  "w-full rounded-xl border px-3 py-2 bg-white focus:outline-none focus:ring-2 ring-emerald-200";

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="text-sm">
      {label}
      <div className="mt-1">{children}</div>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </label>
  );
}

function fmtMoney(v: number, moneda: "PEN" | "USD") {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: moneda === "PEN" ? "PEN" : "USD",
    minimumFractionDigits: 2,
  }).format(v);
}

function tasaMensual(tipo: "TEA" | "TNA", valor: number, cap: number) {
  if (tipo === "TEA") return Math.pow(1 + valor, 1 / 12) - 1;
  const iea = Math.pow(1 + valor / cap, cap) - 1;
  return Math.pow(1 + iea, 1 / 12) - 1;
}

function RowKV({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between py-1">
      <span className="text-neutral-600">{k}</span>
      <span className="font-medium">{v}</span>
    </div>
  );
}

export default function NuevaSimulacionPage() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [pagoMensual, setPagoMensual] = useState<number | null>(null);

  /** ⬇⬇⬇ useForm tipado con el MISMO FormValues y el resolver casteado */
  const form = useForm<FormValues>({
    resolver,
    defaultValues: defaultVals,
    mode: "onTouched",
  });

  const moneda = form.watch("moneda");
  const simbolo = useMemo(() => (moneda === "PEN" ? "S/" : "US$"), [moneda]);
  const errors = form.formState.errors;

  const groupKeys: Record<1 | 2 | 3 | 4, (keyof FormValues)[]> = {
    1: ["dni", "nombres", "estadoCivil", "ingresoMensual", "dependientes", "email", "telefono"],
    2: ["tipoInmueble", "departamento", "proyecto", "precioVenta"],
    3: ["tasaValor", "plazoMeses", "cuotaInicial"],
    4: [],
  };

  const onNext = async () => {
    const ok = await form.trigger(groupKeys[step], { shouldFocus: true });
    if (!ok) return;
    setStep((s) => (Math.min(4, s + 1) as 1 | 2 | 3 | 4));
  };

  const onBack = () => setStep((s) => (Math.max(1, s - 1) as 1 | 2 | 3 | 4));

  const onCalcular = async () => {
    const ok = await form.trigger(
      ["tasaValor", "plazoMeses", "precioVenta", "cuotaInicial", "bbp", "bbpMonto", "bonoVerde", "bonoVerdeMonto"],
      { shouldFocus: true }
    );
    if (!ok) return;

    const v = form.getValues();
    const bonos = (v.bbp ? v.bbpMonto : 0) + (v.bonoVerde ? v.bonoVerdeMonto : 0);
    const principal = Math.max(0, v.precioVenta - v.cuotaInicial - bonos);
    const i = tasaMensual(v.tipoTasa, v.tasaValor, v.capitalizacion);
    const f = Math.pow(1 + i, v.plazoMeses);
    const cuotaBase = i > 0 ? (principal * i * f) / (f - 1) : principal / v.plazoMeses;
    const cuota = cuotaBase + (v.desgravamenMensualSoles || 0);

    setPagoMensual(cuota);
    setStep(4);
  };

  const blockInvalidNumber = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "-" || e.key === "+" || e.key === "e" || e.key === "E") e.preventDefault();
  };
  const blurOnWheel = (e: React.WheelEvent<HTMLInputElement>) => {
    (e.currentTarget as HTMLInputElement).blur();
  };

  return (
    <section>
      <div className="grid grid-cols-[240px,1fr] rounded-2xl overflow-hidden border bg-white shadow-sm">
        {/* Sidebar */}
        <aside className="bg-gradient-to-b from-emerald-900 to-emerald-700 text-white">
          <div className="px-5 py-4 font-semibold">MiVivienda</div>
          <ol className="px-2 pb-4 space-y-1">
            {[
              { n: 1, t: "Solicitante" },
              { n: 2, t: "Vivienda y\nproyecto" },
              { n: 3, t: "Financiamiento\ny condiciones" },
              { n: 4, t: "Resultados" },
            ].map((it) => (
              <li key={it.n}>
                <button
                  type="button"
                  onClick={() => setStep(it.n as 1 | 2 | 3 | 4)}
                  className={`w-full text-left px-3 py-2 rounded-md whitespace-pre leading-snug flex items-center gap-3 ${
                    step === it.n ? "bg-emerald-600" : "hover:bg-emerald-600/60"
                  }`}
                >
                  <span
                    className={`grid place-items-center h-6 w-6 rounded-full border ${
                      step >= (it.n as number) ? "bg-white text-emerald-700 border-white" : "border-white/70"
                    }`}
                  >
                    {step > (it.n as number) ? <Check className="h-4 w-4" /> : it.n}
                  </span>
                  <span className="text-sm">{it.t}</span>
                </button>
              </li>
            ))}
          </ol>
        </aside>

        {/* Contenido */}
        <div className="bg-[#fafaf7] p-6">
          <h1 className="text-xl font-semibold">Nueva simulación</h1>
          <p className="mt-1 text-emerald-800 font-medium">
            {step === 1 && "Paso 1: Datos del solicitante"}
            {step === 2 && "Paso 2: Datos de la vivienda y proyecto"}
            {step === 3 && "Paso 3: Financiamiento y condiciones"}
            {step === 4 && "Resultados"}
          </p>

          <div className="mt-4 rounded-2xl border bg-white p-5">
            {step === 1 && (
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="DNI" error={errors.dni?.message}>
                  <input className={INPUT_CLS} {...form.register("dni")} />
                </Field>
                <Field label="Nombres" error={errors.nombres?.message}>
                  <input className={INPUT_CLS} {...form.register("nombres")} />
                </Field>

                <Field label="Estado civil" error={errors.estadoCivil?.message}>
                  <select className={INPUT_CLS} {...form.register("estadoCivil")}>
                    <option>Soltero</option>
                    <option>Casado</option>
                    <option>Conviviente</option>
                    <option>Divorciado</option>
                    <option>Viudo</option>
                  </select>
                </Field>
                <Field label={`Ingreso mensual (${simbolo})`} error={errors.ingresoMensual?.message}>
                  <input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="0.01"
                    onKeyDown={blockInvalidNumber}
                    onWheel={blurOnWheel}
                    className={INPUT_CLS}
                    {...form.register("ingresoMensual", { valueAsNumber: true })}
                  />
                </Field>

                <Field label="Dependientes" error={errors.dependientes?.message}>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    step={1}
                    onKeyDown={blockInvalidNumber}
                    onWheel={blurOnWheel}
                    className={INPUT_CLS}
                    {...form.register("dependientes", { valueAsNumber: true })}
                  />
                </Field>
                <Field label="Correo electrónico" error={errors.email?.message}>
                  <input type="email" className={INPUT_CLS} {...form.register("email")} />
                </Field>

                <Field label="Teléfono" error={errors.telefono?.message}>
                  <input className={INPUT_CLS} {...form.register("telefono")} />
                </Field>
                <Field label="Teléfono (alternativo)">
                  <input className={INPUT_CLS} {...form.register("telefonoAlt")} />
                </Field>
              </div>
            )}

            {step === 2 && (
              <div className="grid gap-3">
                <div className="grid md:grid-cols-2 gap-3">
                  <Field label="Tipo de inmueble">
                    <select className={INPUT_CLS} {...form.register("tipoInmueble")}>
                      <option>Departamento</option>
                      <option>Casa</option>
                      <option>Terreno</option>
                      <option>Otro</option>
                    </select>
                  </Field>

                  <Field label="Departamento">
                    <select className={INPUT_CLS} {...form.register("departamento")}>
                      {[
                        "Lima","Arequipa","Cusco","Piura","La Libertad","Callao","Junín","Lambayeque","Ancash",
                        "Ica","Tacna","Puno","Loreto","Ucayali","San Martín","Cajamarca","Huánuco","Ayacucho",
                        "Apurímac","Pasco","Tumbes","Madre de Dios","Moquegua","Huancavelica","Amazonas",
                      ].map((d) => <option key={d}>{d}</option>)}
                    </select>
                  </Field>
                </div>

                <Field label="Proyecto de vivienda">
                  <input className={INPUT_CLS} {...form.register("proyecto")} />
                </Field>

                <Field label={`Precio de venta (${simbolo})`} error={errors.precioVenta?.message}>
                  <input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="0.01"
                    onKeyDown={blockInvalidNumber}
                    onWheel={blurOnWheel}
                    className={INPUT_CLS}
                    {...form.register("precioVenta", { valueAsNumber: true })}
                  />
                </Field>
              </div>
            )}

            {step === 3 && (
              <div className="grid gap-3">
                <div className="grid md:grid-cols-2 gap-3">
                  <Field label="Moneda">
                    <div className="flex items-center gap-4 px-1">
                      <label className="flex items-center gap-2 text-sm">
                        <input type="radio" value="PEN" {...form.register("moneda")} /> S/
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input type="radio" value="USD" {...form.register("moneda")} /> US$
                      </label>
                    </div>
                  </Field>

                  <Field label="Tasa (selecciona tipo)">
                    <div className="flex items-center gap-4 px-1">
                      <label className="flex items-center gap-2 text-sm">
                        <input type="radio" value="TEA" {...form.register("tipoTasa")} /> TEA
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input type="radio" value="TNA" {...form.register("tipoTasa")} /> TNA
                      </label>
                    </div>
                  </Field>
                </div>

                <div className="grid md:grid-cols-3 gap-3">
                  <Field label="Valor de tasa (proporción)">
                    <input
                      type="number"
                      inputMode="decimal"
                      min={0.0001}
                      step="0.0001"
                      onKeyDown={blockInvalidNumber}
                      onWheel={blurOnWheel}
                      className={INPUT_CLS}
                      {...form.register("tasaValor", { valueAsNumber: true })}
                    />
                  </Field>
                  <Field label="Capitalización (si TNA)">
                    <input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      step={1}
                      onKeyDown={blockInvalidNumber}
                      onWheel={blurOnWheel}
                      className={INPUT_CLS}
                      {...form.register("capitalizacion", { valueAsNumber: true })}
                    />
                  </Field>
                  <Field label="Plazo (meses)">
                    <input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      step={1}
                      onKeyDown={blockInvalidNumber}
                      onWheel={blurOnWheel}
                      className={INPUT_CLS}
                      {...form.register("plazoMeses", { valueAsNumber: true })}
                    />
                  </Field>
                </div>

                <div className="grid md:grid-cols-2 gap-3">
                  <Field label="Periodo de gracia">
                    <select className={INPUT_CLS} {...form.register("graciaTipo")}>
                      <option value="sin">Sin gracia</option>
                      <option value="parcial">Parcial (solo intereses)</option>
                      <option value="total">Total (sin pagos)</option>
                    </select>
                  </Field>
                  <Field label="Meses de gracia">
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      step={1}
                      onKeyDown={blockInvalidNumber}
                      onWheel={blurOnWheel}
                      className={INPUT_CLS}
                      {...form.register("graciaMeses", { valueAsNumber: true })}
                    />
                  </Field>
                </div>

                <div className="grid md:grid-cols-3 gap-3">
                  <Field label={`Desgravamen mensual (${simbolo})`}>
                    <input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step="0.01"
                      onKeyDown={blockInvalidNumber}
                      onWheel={blurOnWheel}
                      className={INPUT_CLS}
                      {...form.register("desgravamenMensualSoles", { valueAsNumber: true })}
                    />
                  </Field>
                  <Field label={`Administración inicial (${simbolo})`}>
                    <input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step="0.01"
                      onKeyDown={blockInvalidNumber}
                      onWheel={blurOnWheel}
                      className={INPUT_CLS}
                      {...form.register("adminInicialSoles", { valueAsNumber: true })}
                    />
                  </Field>
                  <Field label={`Cuota inicial (${simbolo})`}>
                    <input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step="0.01"
                      onKeyDown={blockInvalidNumber}
                      onWheel={blurOnWheel}
                      className={INPUT_CLS}
                      {...form.register("cuotaInicial", { valueAsNumber: true })}
                    />
                  </Field>
                </div>

                <div className="grid md:grid-cols-2 gap-3">
                  <Field label="Bono del Buen Pagador">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" {...form.register("bbp")} />
                      <input
                        type="number"
                        inputMode="decimal"
                        min={0}
                        step="0.01"
                        onKeyDown={blockInvalidNumber}
                        onWheel={blurOnWheel}
                        className={INPUT_CLS}
                        placeholder="Monto"
                        {...form.register("bbpMonto", { valueAsNumber: true })}
                      />
                    </div>
                  </Field>
                  <Field label="Bono Verde (opcional)">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" {...form.register("bonoVerde")} />
                      <input
                        type="number"
                        inputMode="decimal"
                        min={0}
                        step="0.01"
                        onKeyDown={blockInvalidNumber}
                        onWheel={blurOnWheel}
                        className={INPUT_CLS}
                        placeholder="Monto"
                        {...form.register("bonoVerdeMonto", { valueAsNumber: true })}
                      />
                    </div>
                  </Field>
                </div>
              </div>
            )}

            {step === 4 && <ResultsCard pagoMensual={pagoMensual} v={form.getValues()} />}

            {/* Navegación */}
            <div className="mt-5 flex justify-between">
              <button type="button" onClick={onBack} disabled={step === 1} className="rounded-lg border px-4 py-2 text-sm disabled:opacity-50">
                Anterior
              </button>

              {step < 3 && (
                <button type="button" onClick={onNext} className="rounded-lg bg-emerald-700 text-white px-4 py-2 text-sm hover:bg-emerald-800">
                  Siguiente ▸
                </button>
              )}

              {step === 3 && (
                <button type="button" onClick={onCalcular} className="rounded-lg bg-emerald-700 text-white px-4 py-2 text-sm hover:bg-emerald-800">
                  Calcular
                </button>
              )}

              {step === 4 && (
                <button type="button" onClick={() => setStep(1)} className="rounded-lg bg-emerald-700 text-white px-4 py-2 text-sm hover:bg-emerald-800">
                  Volver al inicio
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ===== Resultados ===== */
function ResultsCard({ pagoMensual, v }: { pagoMensual: number | null; v: FormValues }) {
  const bonos = (v.bbp ? v.bbpMonto : 0) + (v.bonoVerde ? v.bonoVerdeMonto : 0);
  const P = Math.max(0, v.precioVenta - v.cuotaInicial - bonos);
  const iMensual = tasaMensual(v.tipoTasa, v.tasaValor, v.capitalizacion);
  const tasaView = (v.tasaValor * 100).toFixed(2);

  return (
    <div className="grid place-items-center">
      <div className="w-full max-w-md bg-emerald-50 rounded-xl p-4 border">
        <div className="rounded-lg bg-emerald-700 text-white text-center py-2 font-semibold">Resultados</div>
        <div className="text-center py-5">
          <div className="text-3xl font-bold text-emerald-800">
            {pagoMensual != null ? fmtMoney(pagoMensual, v.moneda) : "—"}
          </div>
          <div className="text-sm text-neutral-700">Pago mensual (aprox.)</div>
        </div>

        <div className="bg-white rounded-lg border p-3 text-sm">
          <RowKV k="Precio de venta" v={fmtMoney(v.precioVenta, v.moneda)} />
          <RowKV k="Cuota inicial" v={fmtMoney(v.cuotaInicial, v.moneda)} />
          <RowKV k="Bonos" v={fmtMoney(bonos, v.moneda)} />
          <RowKV k="Principal financiado" v={fmtMoney(P, v.moneda)} />
          <RowKV k="Plazo" v={`${v.plazoMeses} meses`} />
          <RowKV k="Tasa" v={`${tasaView}% ${v.tipoTasa}`} />
          <RowKV k="i mensual" v={`${(iMensual * 100).toFixed(3)}%`} />
        </div>
      </div>
    </div>
  );
}
