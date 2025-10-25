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
type BaseSeguro = "saldo" | "saldo_promedio";

type FormVals = {
  // Paso 1 (Vivienda / selección)
  tipoInmueble: "Casa" | "Departamento" | "Terreno" | "Otro";
  departamento: string;
  proyecto: string;
  precioVenta: number;

  // Paso 2 (Financiamiento y condiciones)
  moneda: Moneda;
  tipoTasa: TipoTasa;
  tasaValor: number;        // proporción (0.10 = 10% anual si TEA, o TNA)
  capitalizacion: number;   // si TNA (mínimo 1)
  plazoMeses: number;       // mínimo 1
  tipoGracia: TipoGracia;
  mesesGracia: number;      // >= 0 y < plazoMeses
  adminInicial: number;     // pago único
  cuotaInicial: number;

  // Costos & Seguros (del Word)
  tasaDesgravamenMensual: number;   // proporción mensual (p.ej. 0.0035 = 0.35%)
  baseSeguroDesgravamen: BaseSeguro;
  gastosNotariales: number;
  gastosRegistrales: number;
  tasacionPerito: number;
  financiarGastos: boolean;
  fechaInicio: string;              // "yyyy-mm-dd"

  // Bonos (Bono Verde auto por eco, BTP seleccionable)
  bonoVerde: boolean;        // autogestionado (eco)
  bonoVerdeMonto: number;    // (por definir reglas)
  techoPropio: boolean;      // checkbox solicitado
  techoPropioMonto: number;  // (por definir reglas)

  // (no visibles ahora) BBP reservado
  bbp?: boolean;
  bbpMonto?: number;
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

const LABEL = "text-sm";
const ROW = "grid md:grid-cols-2 gap-3";

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

// ITF 0.005% (del Word)
const ITF = 0.00005;

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
  adminInicial: 0,
  cuotaInicial: 0,

  // Costos & Seguros
  tasaDesgravamenMensual: 0, // proporción (0.0035 = 0.35%)
  baseSeguroDesgravamen: "saldo",
  gastosNotariales: 0,
  gastosRegistrales: 0,
  tasacionPerito: 0,
  financiarGastos: false,
  fechaInicio: "",

  // Bonos
  bonoVerde: false,
  bonoVerdeMonto: 0,
  techoPropio: false,
  techoPropioMonto: 0,

  // BBP reservado
  bbp: false,
  bbpMonto: 0,
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

  // Bonos (sin BBP visible por ahora)
  const bonos =
    (vals.bonoVerde ? vals.bonoVerdeMonto : 0) +
    (vals.techoPropio ? vals.techoPropioMonto : 0);

  // Gastos (si financiar = true, se suman al principal)
  const totalGastos = vals.gastosNotariales + vals.gastosRegistrales + vals.tasacionPerito;

  const principalFinanciado = Math.max(
    0,
    vals.precioVenta - vals.cuotaInicial - bonos + (vals.financiarGastos ? totalGastos : 0)
  );

  // Tasa mensual efectiva
  const i = tasaMensual(vals.tipoTasa, vals.tasaValor, vals.capitalizacion);
  const iMensualPct = i * 100;
  const tea = Math.pow(1 + i, 12) - 1; // aprox de TCEA por ahora

  // Cuota base (sin seguro/ITF), considerando gracia
  // Nota: si gracia total/parcial, capitalizamos o no amortizamos meses de gracia
  const { pagoGracia, pagoRegular, mesesAmort, seguroMes1, itfMes1, cuotaBase } = useMemo(() => {
    const mGr = Math.max(0, Math.min(vals.mesesGracia, vals.plazoMeses - 1));

    // Saldo sobre el que se amortiza después de la gracia
    let P = principalFinanciado;
    if (vals.tipoGracia === "total" && mGr > 0) {
      P = principalFinanciado * Math.pow(1 + i, mGr); // capitaliza interés durante la gracia
    }
    const amortMeses = Math.max(1, vals.plazoMeses - mGr);

    // Cuota base financiera (sin seguro/ITF)
    let C = 0;
    if (i > 0) {
      const f = Math.pow(1 + i, amortMeses);
      C = (P * i * f) / (f - 1);
    } else {
      C = P / amortMeses;
    }

    // Interés del primer mes post-gracia (o mes 1 si sin gracia)
    const interes1 = P * i;
    const amort1 = C - interes1;
    const saldo1 = Math.max(0, P - amort1);

    // Seguro mes 1 según base seleccionada
    const baseSeguro =
      vals.baseSeguroDesgravamen === "saldo"
        ? P
        : (P + saldo1) / 2; // saldo_promedio aprox

    const seguro1 = baseSeguro * Math.max(0, vals.tasaDesgravamenMensual);

    // ITF mes 1 sobre (cuota financiera + seguro)
    const itf1 = ITF * (C + seguro1);

    // Pago durante gracia (si aplica)
    let pagoGr = 0;
    if (vals.tipoGracia === "total" && mGr > 0) {
      // Solo seguro en gracia total (aprox usando P como base)
      const baseG = vals.baseSeguroDesgravamen === "saldo" ? principalFinanciado : principalFinanciado; // aprox
      pagoGr = baseG * Math.max(0, vals.tasaDesgravamenMensual);
    } else if (vals.tipoGracia === "parcial" && mGr > 0) {
      // Interés + seguro
      const baseG = vals.baseSeguroDesgravamen === "saldo" ? principalFinanciado : principalFinanciado; // aprox
      const segG = baseG * Math.max(0, vals.tasaDesgravamenMensual);
      pagoGr = principalFinanciado * i + segG;
    }

    // Pago regular (cuota base + seguro + ITF)
    const pagoReg = C + seguro1 + itf1;

    return {
      pagoGracia: pagoGr,
      pagoRegular: pagoReg,
      mesesAmort: amortMeses,
      seguroMes1: seguro1,
      itfMes1: itf1,
      cuotaBase: C,
    };
  }, [
    vals.mesesGracia,
    vals.plazoMeses,
    vals.tipoGracia,
    vals.baseSeguroDesgravamen,
    vals.tasaDesgravamenMensual,
    principalFinanciado,
    i,
  ]);

  // Selección de casa: setea proyecto, precio (solo lectura), tipo y bonoVerde según eco
  const seleccionarCasa = (c: Casa) => {
    setSelCasa(c.id);
    form.setValue("proyecto", c.titulo);
    form.setValue("tipoInmueble", "Casa");
    form.setValue("departamento", "Lima");
    form.setValue("precioVenta", c.precio);
    form.setValue("bonoVerde", c.eco);
    if (!c.eco) form.setValue("bonoVerdeMonto", 0);
  };

  // Hoy para min de fecha
  const hoy = useMemo(() => {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${mm}-${dd}`;
  }, []);

  // Validación por paso
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
      if (!vals.fechaInicio) {
        setMsg("Selecciona la fecha de inicio del crédito.");
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
        tcea: tea, // aprox (luego TCEA real con cronograma)
        plazoMeses: vals.plazoMeses,
        monto: principalFinanciado,
        moneda: vals.moneda,
        nombre: vals.proyecto || null,
        estado: "En proceso",

        // Resumen útil
        resumen: {
          precioVenta: vals.precioVenta,
          cuotaInicial: vals.cuotaInicial,
          bonos,
          principalFinanciado,
          tasa: vals.tipoTasa,
          tasaValor: vals.tasaValor,
          iMensual: i,
          tipoGracia: vals.tipoGracia,
          mesesGracia: vals.mesesGracia,
          pagoGracia,
          pagoRegular,
          mesesAmort,
          seguroMes1,
          itfMes1,
          cuotaBase,
          eco: selCasa ? casas.find((x) => x.id === selCasa)?.eco === true : false,
          techoPropio: vals.techoPropio,
          totalGastos,
          financiarGastos: vals.financiarGastos,
          fechaInicio: vals.fechaInicio,
          baseSeguroDesgravamen: vals.baseSeguroDesgravamen,
          tasaDesgravamenMensual: vals.tasaDesgravamenMensual,
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
              <div className={ROW}>
                <label className={LABEL}>
                  Proyecto seleccionado
                  <input className={INPUT} readOnly {...form.register("proyecto")} />
                </label>

                {/* Precio de venta ahora es SOLO LECTURA */}
                <label className={LABEL}>
                  Precio de venta (S/)
                  <input
                    type="number"
                    className={`${INPUT} bg-neutral-100`}
                    readOnly
                    tabIndex={-1}
                    {...form.register("precioVenta")}
                  />
                </label>

                {/* Bono Techo Propio (sigue activo en Paso 1) */}
                <label className={`${LABEL} flex items-center gap-2`}>
                  <input type="checkbox" {...form.register("techoPropio")} />
                  <span>Aplicar Bono Techo Propio</span>
                </label>

                {/* Bono Verde: solo indicador, no editable */}
                <div className={LABEL}>
                  Bono Verde aplicable:{" "}
                  <span className={`px-2 py-0.5 rounded-full text-xs border ${
                    vals.bonoVerde
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-neutral-50 text-neutral-700 border-neutral-200"
                  }`}>
                    {vals.bonoVerde ? "Sí (vivienda ecofriendly)" : "No"}
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
        )}

        {/* Paso 2: Financiamiento y condiciones */}
        {step === 2 && (
          <>
            <div className="text-sm text-emerald-900 font-medium">
              Paso 2: Financiamiento y condiciones
            </div>
            <div className="rounded-2xl border bg-white p-4 space-y-5">
              {/* Tasa y plazo */}
              <div className={ROW}>
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
                  Tipo de tasa
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

                <label className={LABEL}>
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

                <label className={LABEL}>
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

                <label className={LABEL}>
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

                <label className={LABEL}>
                  Periodo de gracia
                  <select className={INPUT} {...form.register("tipoGracia")}>
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
                    {...form.register("mesesGracia", { setValueAs: (v) => toInt(v, 0) })}
                  />
                </label>

                <label className={LABEL}>
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

                <label className={LABEL}>
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
                      className={INPUT}
                      onWheel={blurOnWheel}
                      onKeyDown={preventMinus}
                      {...form.register("tasaDesgravamenMensual", { setValueAs: (v) => toNumber(v, 0) })}
                    />
                  </label>

                  <label className={LABEL}>
                    Base del seguro de desgravamen
                    <select className={INPUT} {...form.register("baseSeguroDesgravamen")}>
                      <option value="saldo">Saldo del periodo</option>
                      <option value="saldo_promedio">Saldo promedio del periodo</option>
                    </select>
                  </label>

                  <label className={LABEL}>
                    Gastos notariales ({simbolo})
                    <input
                      type="number"
                      min={0}
                      className={INPUT}
                      onWheel={blurOnWheel}
                      onKeyDown={preventMinus}
                      {...form.register("gastosNotariales", { setValueAs: (v) => toNumber(v, 0) })}
                    />
                  </label>

                  <label className={LABEL}>
                    Gastos registrales ({simbolo})
                    <input
                      type="number"
                      min={0}
                      className={INPUT}
                      onWheel={blurOnWheel}
                      onKeyDown={preventMinus}
                      {...form.register("gastosRegistrales", { setValueAs: (v) => toNumber(v, 0) })}
                    />
                  </label>

                  <label className={LABEL}>
                    Tasación por perito ({simbolo})
                    <input
                      type="number"
                      min={0}
                      className={INPUT}
                      onWheel={blurOnWheel}
                      onKeyDown={preventMinus}
                      {...form.register("tasacionPerito", { setValueAs: (v) => toNumber(v, 0) })}
                    />
                  </label>

                  <label className={`${LABEL} flex items-center gap-2`}>
                    <input type="checkbox" {...form.register("financiarGastos")} />
                    <span>Financiar gastos</span>
                  </label>

                  <label className={LABEL}>
                    Fecha de inicio
                    <input
                      type="date"
                      min={hoy}
                      className={INPUT}
                      {...form.register("fechaInicio")}
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
                    <div className="text-xs text-neutral-600">
                      (Estimado con seguro/ITF del primer mes)
                    </div>
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
                      <span>
                        {fmtMoneda(
                          (vals.bonoVerde ? vals.bonoVerdeMonto : 0) +
                            (vals.techoPropio ? vals.techoPropioMonto : 0),
                          vals.moneda
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Gastos {vals.financiarGastos ? "(financiados)" : "(no financiados)"}</span>
                      <span>{fmtMoneda(totalGastos, vals.moneda)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Principal financiado</span>
                      <span>{fmtMoneda(principalFinanciado, vals.moneda)}</span>
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
                    <div className="flex justify-between">
                      <span>Cuota financiera (sin seguro/ITF)</span>
                      <span>{fmtMoneda(cuotaBase, vals.moneda)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Seguro desgravamen (mes 1)</span>
                      <span>{fmtMoneda(seguroMes1, vals.moneda)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>ITF (mes 1)</span>
                      <span>{fmtMoneda(itfMes1, vals.moneda)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Ecofriendly</span>
                      <span>{vals.bonoVerde ? "Sí (Bono Verde aplicable)" : "No"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Techo Propio</span>
                      <span>{vals.techoPropio ? "Aplicado" : "No aplica"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Inicio del crédito</span>
                      <span>{vals.fechaInicio || "—"}</span>
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
