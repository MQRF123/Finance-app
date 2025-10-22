"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check } from "lucide-react";
import { simular } from "@/lib/finance/sim";

/* =========================================================
   ESQUEMA ÚNICO (no importes otro schema ni tipos aquí)
   ========================================================= */
const schema = z.object({
  // Paso 1 – Solicitante
  dni: z.string().min(8, "DNI inválido"),
  nombres: z.string().min(2, "Ingresa el nombre"),
  estadoCivil: z.enum(["Soltero", "Casado", "Conviviente", "Divorciado", "Viudo"]),
  ingresoMensual: z.coerce.number().min(0, "Debe ser ≥ 0"),
  dependientes: z.coerce.number().min(0, "Debe ser ≥ 0").default(0),
  email: z.string().email("Correo inválido"),
  telefono: z.string().min(6, "Teléfono inválido"),
  telefonoAlt: z.string().optional(),

  // Paso 2 – Vivienda y proyecto
  tipoInmueble: z.enum(["Casa", "Departamento", "Terreno", "Otro"]),
  departamento: z.string().min(2, "Selecciona un departamento"),
  proyecto: z.string().min(2, "Ingresa el proyecto"),
  precioVenta: z.coerce.number().min(0, "Debe ser ≥ 0"),

  // Paso 3 – Financiamiento y condiciones
  moneda: z.enum(["PEN", "USD"]).default("PEN"),
  tipoTasa: z.enum(["TEA", "TNA"]).default("TEA"),
  tasaValor: z.coerce.number().min(0.0001, "Debe ser ≥ 0.0001"), // 0.10 = 10%
  capitalizacion: z.coerce.number().min(1, "Debe ser ≥ 1").default(12), // si TNA
  plazoMeses: z.coerce.number().min(1, "Debe ser ≥ 1"),
  graciaTipo: z.enum(["sin", "parcial", "total"]).default("sin"),
  graciaMeses: z.coerce.number().min(0, "Debe ser ≥ 0").default(0),

  // Costos / seguros (maqueta)
  desgravamenMensualSoles: z.coerce.number().min(0, "Debe ser ≥ 0").default(0),
  adminInicialSoles: z.coerce.number().min(0, "Debe ser ≥ 0").default(0),

  // Bonos / inicial
  bbp: z.boolean().default(false),
  bbpMonto: z.coerce.number().min(0, "Debe ser ≥ 0").default(0),
  bonoVerde: z.boolean().default(false),
  bonoVerdeMonto: z.coerce.number().min(0, "Debe ser ≥ 0").default(0),
  cuotaInicial: z.coerce.number().min(0, "Debe ser ≥ 0").default(0),
});

// Tipo “fuerte” que usaremos puntualmente
type FormValues = z.output<typeof schema>;

/* ================== HELPERS FINANCIEROS ================== */
function fmtMoney(v: number, moneda: "PEN" | "USD") {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: moneda === "PEN" ? "PEN" : "USD",
    minimumFractionDigits: 2,
  }).format(v);
}

function tasaMensual(tipo: "TEA" | "TNA", valor: number, cap: number) {
  if (tipo === "TEA") return Math.pow(1 + valor, 1 / 12) - 1;
  return valor / cap;
}

function cuotaFrancesa(P: number, i: number, n: number) {
  if (i <= 0) return P / n;
  const f = Math.pow(1 + i, n);
  return (P * i * f) / (f - 1);
}

/* ============ Helpers de inputs (anti negativos / rueda) ============ */
const blockInvalidNumber = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (e.key === "-" || e.key === "+" || e.key === "e" || e.key === "E") e.preventDefault();
};
const blurOnWheel = (e: React.WheelEvent<HTMLInputElement>) => {
  (e.currentTarget as HTMLInputElement).blur();
};

const INPUT_CLS =
  "w-full rounded-xl border px-3 py-2 bg-white focus:outline-none focus:ring-2 ring-emerald-200";

export default function NuevaSimulacionPage() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [pagoMensual, setPagoMensual] = useState<number | null>(null);

  const defaultVals: FormValues = {
    // Paso 1
    dni: "",
    nombres: "",
    estadoCivil: "Soltero",
    ingresoMensual: 0,
    dependientes: 0,
    email: "",
    telefono: "",
    telefonoAlt: "",

    // Paso 2
    tipoInmueble: "Departamento",
    departamento: "Lima",
    proyecto: "",
    precioVenta: 0,

    // Paso 3
    moneda: "PEN",
    tipoTasa: "TEA",
    tasaValor: 0.1,
    capitalizacion: 12,
    plazoMeses: 240,
    graciaTipo: "sin",
    graciaMeses: 0,

    desgravamenMensualSoles: 0,
    adminInicialSoles: 0,

    // Bonos / inicial
    bbp: false,
    bbpMonto: 0,
    bonoVerde: false,
    bonoVerdeMonto: 0,
    cuotaInicial: 0,
  };

  // ✅ FAILSAFE: evita choque de tipos
  const form = useForm({
    resolver: zodResolver(schema) as any,
    defaultValues: defaultVals as any,
    mode: "onTouched",
  });

  const onNext = async () => {
    const groups: Record<number, (keyof FormValues)[]> = {
      1: ["dni", "nombres", "estadoCivil", "ingresoMensual", "dependientes", "email", "telefono"],
      2: ["tipoInmueble", "departamento", "proyecto", "precioVenta"],
      3: ["tasaValor", "plazoMeses"],
      4: [],
    };
    const ok = await form.trigger(groups[step] as any, { shouldFocus: true });
    if (!ok) return;
    setStep((s) => (Math.min(4, s + 1) as 1 | 2 | 3 | 4));
  };

  const onBack = () => setStep((s) => (Math.max(1, s - 1) as 1 | 2 | 3 | 4));

  const onCalcular = async () => {
  const ok = await form.trigger(
    ["tasaValor","plazoMeses","precioVenta","cuotaInicial","bbp","bbpMonto","bonoVerde","bonoVerdeMonto"] as any,
    { shouldFocus: true }
  );
  if (!ok) return;
  const v = form.getValues() as any;

  const bonos = [];
  if (v.bbp && v.bbpMonto > 0) bonos.push({ nombre: "Bono Buen Pagador", monto: v.bbpMonto });
  if (v.bonoVerde && v.bonoVerdeMonto > 0) bonos.push({ nombre: "Bono Verde", monto: v.bonoVerdeMonto });
  if (v.btp && v.btpMonto > 0) bonos.push({ nombre: "Bono Techo Propio", monto: v.btpMonto }); // si luego agregas BTP al form

  const seguro =
    v.tasaDesgravamenMensual // si más adelante usas % sobre saldo
      ? ({ mode: "porcentaje", tasaMensual: v.tasaDesgravamenMensual, base: v.baseSeguro ?? "saldo" } as const)
      : ({ mode: "fijo", monto: v.desgravamenMensualSoles ?? 0 } as const);

  const res = simular({
    moneda: v.moneda,
    tipoTasa: v.tipoTasa,
    tasaValor: v.tasaValor,
    capitalizacion: v.capitalizacion,
    plazoMeses: v.plazoMeses,
    graciaTipo: v.graciaTipo,
    graciaMeses: v.graciaMeses,
    precioVenta: v.precioVenta,
    cuotaInicial: v.cuotaInicial,
    bonos,
    itf: 0.00005,
    costosIniciales: (v.adminInicialSoles ?? 0) + (v.gastosNotariales ?? 0) + (v.gastosRegistrales ?? 0) + (v.tasacionPerito ?? 0),
    seguro,
    cobraSeguroEnGraciaTotal: false,
  });

  // Muestra resultados en tu Paso 4
  setPagoMensual(res.pagoConstante + res.rows.find(r => r.mes === (v.graciaMeses + 1))!.seguro); // opcional
  // Además puedes guardar en estado res.tcea, res.tirMensual, res.vanMensual y res.rows (cronograma)
  setStep(4);
  };

  const moneda = form.watch("moneda") as FormValues["moneda"];
  const simbolo = useMemo(() => (moneda === "PEN" ? "S/" : "US$"), [moneda]);

  return (
    <section>
      <div className="grid grid-cols-[240px,1fr] rounded-2xl overflow-hidden border bg-white shadow-sm">
        {/* Sidebar pasos */}
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
                <Field label="DNI" error={(form.formState.errors as any).dni?.message}>
                  <input className={INPUT_CLS} {...form.register("dni" as const)} />
                </Field>
                <Field label="Nombres" error={(form.formState.errors as any).nombres?.message}>
                  <input className={INPUT_CLS} {...form.register("nombres" as const)} />
                </Field>

                <Field label="Estado civil" error={(form.formState.errors as any).estadoCivil?.message}>
                  <select className={INPUT_CLS} {...form.register("estadoCivil" as const)}>
                    <option>Soltero</option>
                    <option>Casado</option>
                    <option>Conviviente</option>
                    <option>Divorciado</option>
                    <option>Viudo</option>
                  </select>
                </Field>
                <Field label={`Ingreso mensual (${simbolo})`} error={(form.formState.errors as any).ingresoMensual?.message}>
                  <input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="0.01"
                    onKeyDown={blockInvalidNumber}
                    onWheel={blurOnWheel}
                    className={INPUT_CLS}
                    {...form.register("ingresoMensual" as const, { valueAsNumber: true })}
                  />
                </Field>

                <Field label="Dependientes" error={(form.formState.errors as any).dependientes?.message}>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    step={1}
                    onKeyDown={blockInvalidNumber}
                    onWheel={blurOnWheel}
                    className={INPUT_CLS}
                    {...form.register("dependientes" as const, { valueAsNumber: true })}
                  />
                </Field>
                <Field label="Correo electrónico" error={(form.formState.errors as any).email?.message}>
                  <input type="email" className={INPUT_CLS} {...form.register("email" as const)} />
                </Field>

                <Field label="Teléfono" error={(form.formState.errors as any).telefono?.message}>
                  <input className={INPUT_CLS} {...form.register("telefono" as const)} />
                </Field>
                <Field label="Teléfono (alternativo)">
                  <input className={INPUT_CLS} {...form.register("telefonoAlt" as const)} />
                </Field>
              </div>
            )}

            {step === 2 && (
              <div className="grid gap-3">
                <div className="grid md:grid-cols-2 gap-3">
                  <Field label="Tipo de inmueble">
                    <select className={INPUT_CLS} {...form.register("tipoInmueble" as const)}>
                      <option>Departamento</option>
                      <option>Casa</option>
                      <option>Terreno</option>
                      <option>Otro</option>
                    </select>
                  </Field>

                  <Field label="Departamento">
                    <select className={INPUT_CLS} {...form.register("departamento" as const)}>
                      {[
                        "Lima","Arequipa","Cusco","Piura","La Libertad","Callao","Junín","Lambayeque","Ancash",
                        "Ica","Tacna","Puno","Loreto","Ucayali","San Martín","Cajamarca","Huánuco","Ayacucho",
                        "Apurímac","Pasco","Tumbes","Madre de Dios","Moquegua","Huancavelica","Amazonas",
                      ].map((d) => <option key={d}>{d}</option>)}
                    </select>
                  </Field>
                </div>

                <Field label="Proyecto de vivienda">
                  <input className={INPUT_CLS} {...form.register("proyecto" as const)} />
                </Field>

                <Field label={`Precio de venta (${simbolo})`} error={(form.formState.errors as any).precioVenta?.message}>
                  <input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="0.01"
                    onKeyDown={blockInvalidNumber}
                    onWheel={blurOnWheel}
                    className={INPUT_CLS}
                    {...form.register("precioVenta" as const, { valueAsNumber: true })}
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
                        <input type="radio" value="PEN" {...form.register("moneda" as const)} /> S/
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input type="radio" value="USD" {...form.register("moneda" as const)} /> US$
                      </label>
                    </div>
                  </Field>

                  <Field label="Tasa (selecciona tipo)">
                    <div className="flex items-center gap-4 px-1">
                      <label className="flex items-center gap-2 text-sm">
                        <input type="radio" value="TEA" {...form.register("tipoTasa" as const)} /> TEA
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input type="radio" value="TNA" {...form.register("tipoTasa" as const)} /> TNA
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
                      {...form.register("tasaValor" as const, { valueAsNumber: true })}
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
                      {...form.register("capitalizacion" as const, { valueAsNumber: true })}
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
                      {...form.register("plazoMeses" as const, { valueAsNumber: true })}
                    />
                  </Field>
                </div>

                <div className="grid md:grid-cols-2 gap-3">
                  <Field label="Periodo de gracia">
                    <select className={INPUT_CLS} {...form.register("graciaTipo" as const)}>
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
                      {...form.register("graciaMeses" as const, { valueAsNumber: true })}
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
                      {...form.register("desgravamenMensualSoles" as const, { valueAsNumber: true })}
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
                      {...form.register("adminInicialSoles" as const, { valueAsNumber: true })}
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
                      {...form.register("cuotaInicial" as const, { valueAsNumber: true })}
                    />
                  </Field>
                </div>

                <div className="grid md:grid-cols-2 gap-3">
                  <Field label="Bono del Buen Pagador">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" {...form.register("bbp" as const)} />
                      <input
                        type="number"
                        inputMode="decimal"
                        min={0}
                        step="0.01"
                        onKeyDown={blockInvalidNumber}
                        onWheel={blurOnWheel}
                        className={INPUT_CLS}
                        placeholder="Monto"
                        {...form.register("bbpMonto" as const, { valueAsNumber: true })}
                      />
                    </div>
                  </Field>
                  <Field label="Bono Verde (opcional)">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" {...form.register("bonoVerde" as const)} />
                      <input
                        type="number"
                        inputMode="decimal"
                        min={0}
                        step="0.01"
                        onKeyDown={blockInvalidNumber}
                        onWheel={blurOnWheel}
                        className={INPUT_CLS}
                        placeholder="Monto"
                        {...form.register("bonoVerdeMonto" as const, { valueAsNumber: true })}
                      />
                    </div>
                  </Field>
                </div>
              </div>
            )}

            {step === 4 && (
              <ResultsCard
                pagoMensual={pagoMensual}
                v={form.getValues() as FormValues}
              />
            )}

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

/* ====================== Subcomponentes ====================== */

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="text-sm">
      {label}
      <div className="mt-1">{children}</div>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </label>
  );
}

function ResultsCard({ pagoMensual, v }: { pagoMensual: number | null; v: FormValues }) {
  const P = Math.max(0, v.precioVenta - v.cuotaInicial - (v.bbp ? v.bbpMonto : 0) - (v.bonoVerde ? v.bonoVerdeMonto : 0));
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
          <Row k="Precio de venta" v={fmtMoney(v.precioVenta, v.moneda)} />
          <Row k="Cuota inicial" v={fmtMoney(v.cuotaInicial, v.moneda)} />
          <Row k="Bonos" v={fmtMoney((v.bbp ? v.bbpMonto : 0) + (v.bonoVerde ? v.bonoVerdeMonto : 0), v.moneda)} />
          <Row k="Principal financiado" v={fmtMoney(P, v.moneda)} />
          <Row k="Plazo" v={`${v.plazoMeses} meses`} />
          <Row k="Tasa" v={`${tasaView}% ${v.tipoTasa}`} />
          <Row k="i mensual" v={`${(iMensual * 100).toFixed(3)}%`} />
        </div>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between py-1">
      <span className="text-neutral-600">{k}</span>
      <span className="font-medium">{v}</span>
    </div>
  );
}
