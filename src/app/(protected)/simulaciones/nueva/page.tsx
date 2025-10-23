"use client";

import type React from "react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";

/* ================= Tipos ================= */
type Moneda = "PEN" | "USD";
type TipoTasa = "TEA" | "TNA";
type TipoGracia = "sin" | "total" | "parcial";

type FormVals = {
  // Paso 1
  dni: string;
  nombres: string;
  estadoCivil: "Soltero" | "Casado" | "Conviviente" | "Divorciado" | "Viudo";
  ingresoMensual: number;
  dependientes: number;
  email: string;
  telefono: string;
  telefonoAlt?: string;

  // Paso 2
  tipoInmueble: "Casa" | "Departamento" | "Terreno" | "Otro";
  departamento: string;
  proyecto: string;
  precioVenta: number;

  // Paso 3
  moneda: Moneda;
  tipoTasa: TipoTasa;
  tasaValor: number;        // proporción (0.1 = 10%)
  capitalizacion: number;   // si TNA (mínimo 1)
  plazoMeses: number;       // mínimo 1
  tipoGracia: TipoGracia;
  mesesGracia: number;      // >= 0 y < plazoMeses
  desgravamenMensualSoles: number; // S/
  adminInicial: number;     // pago único
  cuotaInicial: number;

  bbp: boolean;
  bbpMonto: number;
  bonoVerde: boolean;
  bonoVerdeMonto: number;
};

/* ============== Helpers y estilos ============== */
const INPUT =
  "w-full rounded-xl border px-3 py-2 bg-white focus:outline-none focus:ring-2 ring-emerald-200";

// Números seguros >= min
const toNumber = (v: unknown, min = 0) => {
  if (typeof v === "number") return Math.max(min, isFinite(v) ? v : 0);
  if (typeof v === "string") {
    const n = parseFloat(v.replace(",", "."));
    return Math.max(min, isFinite(n) ? n : 0);
  }
  return min;
};
const toInt = (v: unknown, min = 0) => Math.max(min, Math.floor(toNumber(v, min)));

// Bloquear '-', '+', 'e', 'E' en number
const preventMinus = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (e.key === "-" || e.key === "+" || e.key === "e" || e.key === "E") e.preventDefault();
};
// Evitar scroll para cambiar número
const blurOnWheel = (e: React.WheelEvent<HTMLInputElement>) => {
  (e.currentTarget as HTMLInputElement).blur();
};

function tasaMensual(tipo: TipoTasa, v: number, cap: number) {
  v = Math.max(0, v);
  if (tipo === "TEA") return Math.pow(1 + v, 1 / 12) - 1;
  const c = Math.max(1, cap);
  const iea = Math.pow(1 + v / c, c) - 1;
  return Math.pow(1 + iea, 1 / 12) - 1;
}

function fmtMoneda(v: number, m: Moneda) {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: m === "USD" ? "USD" : "PEN",
    minimumFractionDigits: 2,
  }).format(v);
}

const defaultValues: FormVals = {
  // 1
  dni: "",
  nombres: "",
  estadoCivil: "Soltero",
  ingresoMensual: 0,
  dependientes: 0,
  email: "",
  telefono: "",
  telefonoAlt: "",
  // 2
  tipoInmueble: "Departamento",
  departamento: "Lima",
  proyecto: "",
  precioVenta: 0,
  // 3
  moneda: "PEN",
  tipoTasa: "TEA",
  tasaValor: 0.1,
  capitalizacion: 12,
  plazoMeses: 240,
  tipoGracia: "sin",
  mesesGracia: 0,
  desgravamenMensualSoles: 0,
  adminInicial: 0,
  cuotaInicial: 0,
  bbp: false,
  bbpMonto: 0,
  bonoVerde: false,
  bonoVerdeMonto: 0,
};

/* ============== Página ============== */
export default function NuevaSimulacionPage() {
  const { user } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [msg, setMsg] = useState("");

  const form = useForm<FormVals>({ defaultValues, mode: "onTouched" });

  const moneda = form.watch("moneda");
  const simbolo = useMemo(() => (moneda === "PEN" ? "S/" : "US$"), [moneda]);

  const vals = form.watch();

  // Bonos y principal
  const bonos = (vals.bbp ? vals.bbpMonto : 0) + (vals.bonoVerde ? vals.bonoVerdeMonto : 0);
  const principal = Math.max(0, vals.precioVenta - vals.cuotaInicial - bonos);

  // Tasas
  const i = tasaMensual(vals.tipoTasa, vals.tasaValor, vals.capitalizacion);
  const iMensualPct = i * 100;
  const tea = Math.pow(1 + i, 12) - 1; // aproximación de TCEA por ahora

  // Gracia total / parcial
  const { pagoGracia, pagoRegular, mesesAmort } = useMemo(() => {
    const mGr = Math.max(0, Math.min(vals.mesesGracia, vals.plazoMeses - 1));
    let amortMeses = vals.plazoMeses;
    let pago1 = 0; // pago durante gracia
    let P = principal;

    if (vals.tipoGracia === "total" && mGr > 0) {
      P = principal * Math.pow(1 + i, mGr); // capitaliza interés
      amortMeses = Math.max(1, vals.plazoMeses - mGr);
      pago1 = vals.desgravamenMensualSoles; // si quieres mostrar pago en gracia total
    } else if (vals.tipoGracia === "parcial" && mGr > 0) {
      pago1 = principal * i + vals.desgravamenMensualSoles; // interés + seguro
      amortMeses = Math.max(1, vals.plazoMeses - mGr);
    }

    let cuotaBase = 0;
    if (i > 0) {
      const f = Math.pow(1 + i, amortMeses);
      cuotaBase = (P * i * f) / (f - 1);
    } else {
      cuotaBase = P / amortMeses;
    }
    const pago2 = cuotaBase + vals.desgravamenMensualSoles;
    return { pagoGracia: pago1, pagoRegular: pago2, mesesAmort: amortMeses };
  }, [vals.tipoGracia, vals.mesesGracia, vals.plazoMeses, vals.desgravamenMensualSoles, principal, i]);

  // Validación por paso (sin setValue para evitar conflicto de tipos)
  const goNext = async () => {
    // Reglas simples por paso
    if (step === 2) {
      if (principal <= 0) {
        setMsg("El principal financiado debe ser mayor a 0 (revisa precio, cuota inicial y bonos).");
        return;
      }
    }
    if (step === 3) {
      if (vals.mesesGracia >= vals.plazoMeses) {
        setMsg("Los meses de gracia deben ser menores al plazo.");
        return;
      }
    }

    setMsg("");
    setStep((s) => (Math.min(4, s + 1) as 1 | 2 | 3 | 4));
  };

  const goBack = () => setStep((s) => (Math.max(1, s - 1) as 1 | 2 | 3 | 4));
  const onCalcular = () => setStep(4);

  const onGuardar = async () => {
    setMsg("");
    if (!user) {
      setMsg("Debes iniciar sesión para guardar.");
      return;
    }
    try {
      await addDoc(collection(db, "simulaciones"), {
        userId: user.uid,
        createdAt: serverTimestamp(),

        // Claves para dashboard/historial
        tcea: tea, // aprox
        plazoMeses: vals.plazoMeses,
        monto: principal,
        moneda: vals.moneda,
        nombre: vals.proyecto || vals.nombres || null,
        estado: "En proceso",

        // Resumen útil
        resumen: {
          precioVenta: vals.precioVenta,
          cuotaInicial: vals.cuotaInicial,
          bonos,
          principal,
          tasa: vals.tipoTasa,
          tasaValor: vals.tasaValor,
          iMensual: i,
          tipoGracia: vals.tipoGracia,
          mesesGracia: vals.mesesGracia,
          pagoGracia,
          pagoRegular,
          mesesAmort,
        },

        // Todo el formulario (opcional)
        form: vals,
      });
      setMsg("✔ Simulación guardada. La verás en Dashboard e Historial.");
    } catch (e: unknown) {
      // eslint-disable-next-line no-console
      console.error(e);
      const message = e instanceof Error ? e.message : "Error al guardar.";
      setMsg(message);
    }
  };

  /* ================== UI ================== */
  return (
    <div className="grid lg:grid-cols-[280px_1fr] gap-5">
      {/* Sidebar de pasos */}
      <aside className="rounded-2xl bg-emerald-800 text-white p-4 space-y-3">
        {[
          { n: 1, t: "Solicitante" },
          { n: 2, t: "Vivienda y\nproyecto" },
          { n: 3, t: "Financiamiento\ny condiciones" },
          { n: 4, t: "Resultados" },
        ].map((it) => (
          <div
            key={it.n}
            className={`px-3 py-3 rounded-xl whitespace-pre-line ${
              step === it.n ? "bg-emerald-700" : "bg-emerald-900/20"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="inline-grid place-items-center h-6 w-6 rounded-full bg-white/10 border border-white/30">
                {it.n}
              </span>
              <span className="text-sm">{it.t}</span>
            </div>
          </div>
        ))}
      </aside>

      {/* Contenido */}
      <section className="space-y-4">
        <h1 className="text-xl font-semibold">Nueva simulación</h1>

        {/* Paso 1 */}
        {step === 1 && (
          <>
            <div className="text-sm text-emerald-900 font-medium">Paso 1: Datos del solicitante</div>
            <div className="rounded-2xl border bg-white p-4 space-y-3">
              <div className="grid md:grid-cols-2 gap-3">
                <label className="text-sm">
                  DNI
                  <input className={INPUT} {...form.register("dni")} />
                </label>
                <label className="text-sm">
                  Nombres
                  <input className={INPUT} {...form.register("nombres")} />
                </label>

                <label className="text-sm">
                  Estado civil
                  <select className={INPUT} {...form.register("estadoCivil")}>
                    {["Soltero", "Casado", "Conviviente", "Divorciado", "Viudo"].map((x) => (
                      <option key={x} value={x}>
                        {x}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm">
                  Ingreso mensual ({simbolo})
                  <input
                    type="number"
                    min={0}
                    className={INPUT}
                    onWheel={blurOnWheel}
                    onKeyDown={preventMinus}
                    {...form.register("ingresoMensual", { setValueAs: (v) => toNumber(v, 0) })}
                  />
                </label>

                <label className="text-sm">
                  Dependientes
                  <input
                    type="number"
                    min={0}
                    step={1}
                    className={INPUT}
                    onWheel={blurOnWheel}
                    onKeyDown={preventMinus}
                    {...form.register("dependientes", { setValueAs: (v) => toInt(v, 0) })}
                  />
                </label>
                <label className="text-sm">
                  Correo electrónico
                  <input className={INPUT} type="email" {...form.register("email")} />
                </label>

                <label className="text-sm">
                  Teléfono
                  <input className={INPUT} {...form.register("telefono")} />
                </label>
                <label className="text-sm">
                  Teléfono (alternativo)
                  <input className={INPUT} {...form.register("telefonoAlt")} />
                </label>
              </div>

              <div className="flex justify-between pt-2">
                <button className="rounded-lg border px-4 py-2 text-sm" disabled>
                  Anterior
                </button>
                <button onClick={goNext} className="rounded-lg bg-emerald-700 text-white px-4 py-2 text-sm">
                  Siguiente ▸
                </button>
              </div>
            </div>
          </>
        )}

        {/* Paso 2 */}
        {step === 2 && (
          <>
            <div className="text-sm text-emerald-900 font-medium">Paso 2: Datos de la vivienda y proyecto</div>
            <div className="rounded-2xl border bg-white p-4 space-y-3">
              <div className="grid md:grid-cols-2 gap-3">
                <label className="text-sm">
                  Tipo de inmueble
                  <select className={INPUT} {...form.register("tipoInmueble")}>
                    {["Casa", "Departamento", "Terreno", "Otro"].map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                </label>
                <label className="text-sm">
                  Departamento
                  <input className={INPUT} {...form.register("departamento")} />
                </label>

                <label className="md:col-span-2 text-sm">
                  Proyecto de vivienda
                  <input className={INPUT} {...form.register("proyecto")} />
                </label>

                <label className="md:col-span-2 text-sm">
                  Precio de venta ({simbolo})
                  <input
                    type="number"
                    min={0}
                    className={INPUT}
                    onWheel={blurOnWheel}
                    onKeyDown={preventMinus}
                    {...form.register("precioVenta", { setValueAs: (v) => toNumber(v, 0) })}
                  />
                </label>
              </div>

              <div className="flex justify-between pt-2">
                <button onClick={goBack} className="rounded-lg border px-4 py-2 text-sm">
                  Anterior
                </button>
                <button onClick={goNext} className="rounded-lg bg-emerald-700 text-white px-4 py-2 text-sm">
                  Siguiente ▸
                </button>
              </div>
            </div>
          </>
        )}

        {/* Paso 3 */}
        {step === 3 && (
          <>
            <div className="text-sm text-emerald-900 font-medium">Paso 3: Financiamiento y condiciones</div>
            <div className="rounded-2xl border bg-white p-4 space-y-3">
              <div className="grid md:grid-cols-2 gap-3">
                <div className="text-sm">
                  Moneda
                  <div className="mt-1 flex gap-4">
                    <label className="flex items-center gap-2">
                      <input type="radio" value="PEN" {...form.register("moneda")} />
                      S/
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="radio" value="USD" {...form.register("moneda")} />
                      US$
                    </label>
                  </div>
                </div>

                <div className="text-sm">
                  Tasa (selecciona tipo)
                  <div className="mt-1 flex gap-4">
                    <label className="flex items-center gap-2">
                      <input type="radio" value="TEA" {...form.register("tipoTasa")} />
                      TEA
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="radio" value="TNA" {...form.register("tipoTasa")} />
                      TNA
                    </label>
                  </div>
                </div>

                <label className="text-sm">
                  Valor de tasa (proporción)
                  <input
                    type="number"
                    min={0}
                    step="0.0001"
                    className={INPUT}
                    onWheel={blurOnWheel}
                    onKeyDown={preventMinus}
                    {...form.register("tasaValor", { setValueAs: (v) => toNumber(v, 0) })}
                  />
                </label>

                <label className="text-sm">
                  Capitalización (si TNA)
                  <input
                    type="number"
                    min={1}
                    step={1}
                    className={INPUT}
                    onWheel={blurOnWheel}
                    onKeyDown={preventMinus}
                    {...form.register("capitalizacion", { setValueAs: (v) => toInt(v, 1) })}
                  />
                </label>

                <label className="text-sm">
                  Plazo (meses)
                  <input
                    type="number"
                    min={1}
                    step={1}
                    className={INPUT}
                    onWheel={blurOnWheel}
                    onKeyDown={preventMinus}
                    {...form.register("plazoMeses", { setValueAs: (v) => toInt(v, 1) })}
                  />
                </label>

                <label className="text-sm">
                  Periodo de gracia
                  <select className={INPUT} {...form.register("tipoGracia")}>
                    <option value="sin">Sin gracia</option>
                    <option value="total">Total</option>
                    <option value="parcial">Parcial</option>
                  </select>
                </label>

                <label className="text-sm">
                  Meses de gracia
                  <input
                    type="number"
                    min={0}
                    step={1}
                    className={INPUT}
                    onWheel={blurOnWheel}
                    onKeyDown={preventMinus}
                    {...form.register("mesesGracia", { setValueAs: (v) => toInt(v, 0) })}
                  />
                </label>

                <label className="text-sm">
                  Desgravamen mensual ({simbolo})
                  <input
                    type="number"
                    min={0}
                    className={INPUT}
                    onWheel={blurOnWheel}
                    onKeyDown={preventMinus}
                    {...form.register("desgravamenMensualSoles", { setValueAs: (v) => toNumber(v, 0) })}
                  />
                </label>

                <label className="text-sm">
                  Administración inicial ({simbolo})
                  <input
                    type="number"
                    min={0}
                    className={INPUT}
                    onWheel={blurOnWheel}
                    onKeyDown={preventMinus}
                    {...form.register("adminInicial", { setValueAs: (v) => toNumber(v, 0) })}
                  />
                </label>

                <label className="text-sm">
                  Cuota inicial ({simbolo})
                  <input
                    type="number"
                    min={0}
                    className={INPUT}
                    onWheel={blurOnWheel}
                    onKeyDown={preventMinus}
                    {...form.register("cuotaInicial", { setValueAs: (v) => toNumber(v, 0) })}
                  />
                </label>

                {/* Bonos */}
                <div className="md:col-span-2 grid md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3 items-end">
                  <label className="text-sm">
                    <span className="block">Bono del Buen Pagador</span>
                    <div className="flex gap-2 items-center">
                      <input type="checkbox" {...form.register("bbp")} />
                      <input
                        type="number"
                        min={0}
                        className={INPUT}
                        placeholder="0"
                        onWheel={blurOnWheel}
                        onKeyDown={preventMinus}
                        {...form.register("bbpMonto", { setValueAs: (v) => toNumber(v, 0) })}
                      />
                    </div>
                  </label>

                  <label className="text-sm">
                    <span className="block">Bono Verde (opcional)</span>
                    <div className="flex gap-2 items-center">
                      <input type="checkbox" {...form.register("bonoVerde")} />
                      <input
                        type="number"
                        min={0}
                        className={INPUT}
                        placeholder="0"
                        onWheel={blurOnWheel}
                        onKeyDown={preventMinus}
                        {...form.register("bonoVerdeMonto", { setValueAs: (v) => toNumber(v, 0) })}
                      />
                    </div>
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
        )}

        {/* Paso 4 */}
        {step === 4 && (
          <>
            <div className="text-sm text-emerald-900 font-medium">Resultados</div>
            <div className="rounded-2xl border bg-white p-4 space-y-4">
              <div className="max-w-md mx-auto rounded-xl border bg-emerald-50">
                <div className="rounded-t-xl bg-emerald-700 text-white text-center py-2 font-semibold">
                  Resultados
                </div>
                <div className="p-4 space-y-3">
                  <div className="text-center py-2">
                    <div className="text-3xl font-bold text-emerald-800">
                      {fmtMoneda(pagoRegular, vals.moneda)}
                    </div>
                    <div className="text-sm text-neutral-700">Pago mensual (aprox.)</div>
                  </div>

                  <div className="bg-white rounded-lg border p-3 text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>Precio de venta</span>
                      <span>{fmtMoneda(vals.precioVenta, vals.moneda)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cuota inicial</span>
                      <span>{fmtMoneda(vals.cuotaInicial, vals.moneda)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Bonos</span>
                      <span>{fmtMoneda(bonos, vals.moneda)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Principal financiado</span>
                      <span>{fmtMoneda(principal, vals.moneda)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Plazo</span>
                      <span>{mesesAmort} meses</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tasa</span>
                      <span>
                        {(vals.tasaValor * 100).toFixed(2)}% {vals.tipoTasa}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>i mensual</span>
                      <span>{iMensualPct.toFixed(4)}%</span>
                    </div>
                    {vals.tipoGracia !== "sin" && vals.mesesGracia > 0 && (
                      <div className="flex justify-between">
                        <span>Pago durante gracia</span>
                        <span>{fmtMoneda(pagoGracia, vals.moneda)}</span>
                      </div>
                    )}
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
            </div>
            <div className="pt-1">
              <button onClick={() => setStep(1)} className="rounded-lg border px-4 py-2 text-sm">
                Volver al inicio
              </button>
            </div>
          </>
        )}

        {msg && step !== 4 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            {msg}
          </div>
        )}
      </section>
    </div>
  );
}
