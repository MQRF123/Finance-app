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
  // Paso 1 (Vivienda / selección)
  tipoInmueble: "Casa" | "Departamento" | "Terreno" | "Otro";
  departamento: string;
  proyecto: string;
  precioVenta: number;

  // Paso 2 (Financiamiento y condiciones)
  moneda: Moneda;
  tipoTasa: TipoTasa;
  tasaValor: number;        // proporción (0.10 = 10%)
  capitalizacion: number;   // si TNA (mínimo 1)
  plazoMeses: number;       // mínimo 1
  tipoGracia: TipoGracia;
  mesesGracia: number;      // >= 0 y < plazoMeses
  desgravamenMensualSoles: number; // S/
  adminInicial: number;     // pago único
  cuotaInicial: number;

  // Bonos
  bbp: boolean;
  bbpMonto: number;
  bonoVerde: boolean;
  bonoVerdeMonto: number;
  techoPropio: boolean;       // nuevo: marca BTP
  techoPropioMonto: number;   // lo usaremos cuando definamos el Word
};

type Casa = {
  id: string;
  titulo: string;
  precio: number; // S/
  m2: number;
  eco: boolean;
  distrito: string;
};

/* ============== Helpers y estilos ============== */
const INPUT =
  "w-full rounded-xl border px-3 py-2 bg-white focus:outline-none focus:ring-2 ring-emerald-200";

// Números seguros >= min
const toNumber = (v: unknown, min = 0) => {
  if (typeof v === "number") return Math.max(min, Number.isFinite(v) ? v : 0);
  if (typeof v === "string") {
    const n = parseFloat(v.replace(",", "."));
    return Math.max(min, Number.isFinite(n) ? n : 0);
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
  const vPos = Math.max(0, v);
  if (tipo === "TEA") return Math.pow(1 + vPos, 1 / 12) - 1;
  const c = Math.max(1, cap);
  const iea = Math.pow(1 + vPos / c, c) - 1;
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
  // Vivienda / proyecto
  tipoInmueble: "Casa",
  departamento: "Lima",
  proyecto: "",
  precioVenta: 0,

  // Financiamiento
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

  // Bonos
  bbp: false,
  bbpMonto: 0,
  bonoVerde: false,
  bonoVerdeMonto: 0,
  techoPropio: false,
  techoPropioMonto: 0,
};

/* ============== Página ============== */
export default function NuevaSimulacionPage() {
  const { user } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [msg, setMsg] = useState("");
  const [selCasa, setSelCasa] = useState<string | null>(null);

  const form = useForm<FormVals>({ defaultValues, mode: "onTouched" });

  // Catálogo (estático, razonable y sin SSR randomness)
  const casas: Casa[] = useMemo(
    () => [
      { id: "c1", titulo: "Casa Miraflores", precio: 250000, m2: 118, eco: true,  distrito: "Miraflores" },
      { id: "c2", titulo: "Casa Surco",       precio: 235000, m2: 112, eco: false, distrito: "Santiago de Surco" },
      { id: "c3", titulo: "Casa Chorrillos",  precio: 199000, m2: 98,  eco: true,  distrito: "Chorrillos" },
      { id: "c4", titulo: "Casa San Miguel",  precio: 185000, m2: 86,  eco: false, distrito: "San Miguel" },
      { id: "c5", titulo: "Casa Comas",       precio: 150000, m2: 76,  eco: false, distrito: "Comas" },
      { id: "c6", titulo: "Casa Magdalena",   precio: 210000, m2: 94,  eco: true,  distrito: "Magdalena del Mar" },
      { id: "c7", titulo: "Casa Ate",         precio: 165000, m2: 80,  eco: false, distrito: "Ate" },
      { id: "c8", titulo: "Casa San Borja",   precio: 245000, m2: 120, eco: true,  distrito: "San Borja" },
    ],
    []
  );

  // Observados/calculados
  const moneda = form.watch("moneda");
  const simbolo = useMemo(() => (moneda === "PEN" ? "S/" : "US$"), [moneda]);
  const vals = form.watch();

  // Bonos y principal (por ahora BTP no afecta hasta definir monto; lo dejamos preparado)
  const bonos =
    (vals.bbp ? vals.bbpMonto : 0) +
    (vals.bonoVerde ? vals.bonoVerdeMonto : 0) +
    (vals.techoPropio ? vals.techoPropioMonto : 0);

  const principal = Math.max(0, vals.precioVenta - vals.cuotaInicial - bonos);

  // Tasas
  const i = tasaMensual(vals.tipoTasa, vals.tasaValor, vals.capitalizacion);
  const iMensualPct = i * 100;
  const tea = Math.pow(1 + i, 12) - 1; // aproximación de TCEA por ahora

  // Gracia total / parcial
  const { pagoGracia, pagoRegular, mesesAmort } = useMemo(() => {
    const mGr = Math.max(0, Math.min(vals.mesesGracia, vals.plazoMeses - 1));
    let amortMeses = vals.plazoMeses;
    let pago1 = 0;
    let P = principal;

    if (vals.tipoGracia === "total" && mGr > 0) {
      P = principal * Math.pow(1 + i, mGr); // capitaliza interés
      amortMeses = Math.max(1, vals.plazoMeses - mGr);
      pago1 = vals.desgravamenMensualSoles; // durante gracia total mostramos seguro (si aplica)
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

  // Selección de casa: setea proyecto, precio, tipo y bonoVerde según eco
  const seleccionarCasa = (c: Casa) => {
    setSelCasa(c.id);
    form.setValue("proyecto", c.titulo);
    form.setValue("tipoInmueble", "Casa");
    form.setValue("departamento", "Lima");
    form.setValue("precioVenta", c.precio);
    form.setValue("bonoVerde", c.eco);
    if (!c.eco) form.setValue("bonoVerdeMonto", 0);
  };

  // Validación por paso (sin setValue masivo)
  const goNext = () => {
    if (step === 1) {
      if (!selCasa) {
        setMsg("Selecciona una casa para continuar.");
        return;
      }
      if (vals.precioVenta <= 0) {
        setMsg("El precio de venta debe ser mayor a 0.");
        return;
      }
    }
    if (step === 2) {
      if (vals.mesesGracia >= vals.plazoMeses) {
        setMsg("Los meses de gracia deben ser menores al plazo.");
        return;
      }
    }
    setMsg("");
    setStep((s) => (Math.min(3, s + 1) as 1 | 2 | 3));
  };

  const goBack = () => setStep((s) => (Math.max(1, s - 1) as 1 | 2 | 3));
  const onCalcular = () => setStep(3);

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
        tcea: tea, // aprox (luego TCEA real con costos/bonos del Word)
        plazoMeses: vals.plazoMeses,
        monto: principal,
        moneda: vals.moneda,
        nombre: vals.proyecto || null,
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
          eco: selCasa ? casas.find((x) => x.id === selCasa)?.eco === true : false,
          techoPropio: vals.techoPropio,
        },

        // Form completo (para edición futura)
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
      {/* Sidebar de pasos (3 pasos) */}
      <aside className="rounded-2xl bg-emerald-800 text-white p-4 space-y-3">
        {[
          { n: 1, t: "Selecciona\nla vivienda" },
          { n: 2, t: "Financiamiento\ny condiciones" },
          { n: 3, t: "Resultados" },
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

        {/* Paso 1: Selección de vivienda */}
        {step === 1 && (
          <>
            <div className="text-sm text-emerald-900 font-medium">Paso 1: Elige tu vivienda</div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {casas.map((c) => {
                const active = selCasa === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => seleccionarCasa(c)}
                    className={`text-left rounded-2xl border bg-white p-4 transition
                      ${active ? "ring-2 ring-emerald-500 border-emerald-500" : "hover:shadow-sm"}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="font-medium">{c.titulo}</div>
                      {c.eco && (
                        <span className="text-[10px] rounded-full bg-emerald-100 text-emerald-700 px-2 py-1 border border-emerald-200">
                          Ecofriendly
                        </span>
                      )}
                    </div>
                    <div className="mt-2 text-2xl font-bold">{fmtMoneda(c.precio, "PEN")}</div>
                    <div className="text-sm text-neutral-600 mt-1">{c.m2} m² · {c.distrito}</div>
                    {active && <div className="text-xs text-emerald-700 mt-2">Seleccionada</div>}
                  </button>
                );
              })}
            </div>

            <div className="rounded-2xl border bg-white p-4">
              <div className="grid md:grid-cols-2 gap-3">
                <label className="text-sm">
                  Proyecto seleccionado
                  <input className={INPUT} readOnly {...form.register("proyecto")} />
                </label>
                <label className="text-sm">
                  Precio de venta (S/)
                  <input
                    type="number"
                    min={0}
                    className={INPUT}
                    onWheel={blurOnWheel}
                    onKeyDown={preventMinus}
                    {...form.register("precioVenta", { setValueAs: (v) => toNumber(v, 0) })}
                  />
                </label>

                {/* Bono Techo Propio (solo marca intención; monto lo agregamos después) */}
                <label className="text-sm flex items-center gap-2">
                  <input type="checkbox" {...form.register("techoPropio")} />
                  <span>Aplicar Bono Techo Propio</span>
                </label>

                {/* Bono Verde: se autoconfigura con la selección eco; el monto se define en el paso 2 */}
                <label className="text-sm flex items-center gap-2">
                  <input type="checkbox" disabled checked={vals.bonoVerde} readOnly />
                  <span>Bono Verde (según vivienda ecofriendly)</span>
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

            {msg && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 mt-2">
                {msg}
              </div>
            )}
          </>
        )}

        {/* Paso 2: Financiamiento y condiciones (igual que antes) */}
        {step === 2 && (
          <>
            <div className="text-sm text-emerald-900 font-medium">
              Paso 2: Financiamiento y condiciones
            </div>
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

                {/* Bonos: montos se siguen configurando aquí */}
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
                    <span className="block">Bono Verde</span>
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

        {/* Paso 3: Resultados */}
        {step === 3 && (
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

        {msg && step !== 3 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            {msg}
          </div>
        )}
      </section>
    </div>
  );
}
