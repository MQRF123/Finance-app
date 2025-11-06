"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "@/lib/auth/use-auth";

import { type FormVals, type Casa } from "@/lib/simulacion/types";

import { saveSimulation } from "@/lib/simulacion/services/firebase";
import { useSimulacionCalculations } from "@/lib/simulacion/use-simulacion-calculations";
import { SimulacionForm } from "@/components/simulaciones/SimulacionForm";
import { casas } from "@/lib/simulacion/data/casas";
import { calcularBonoBuenPagador, calcularBonoVerde } from "@/lib/simulacion/bonos";

const defaultValues: FormVals = {
  // Vivienda / proyecto
  tipoInmueble: "Casa",
  departamento: "Lima",
  proyecto: "",
  precioVenta: 0,
  moneda: "S/",

  // Financiamiento
  tasaValor: 0.1,
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

  const onCasaSelect = (c: Casa) => {
    setSelCasa(c.id);
    form.setValue("proyecto", c.titulo);
    form.setValue("tipoInmueble", "Casa");
    form.setValue("departamento", "Lima");
    form.setValue("precioVenta", c.precio);

    const bbpMonto = calcularBonoBuenPagador(c.precio);
    const bonoVerdeMonto = calcularBonoVerde(c.precio, c.eco);

    form.setValue("bbp", bbpMonto > 0);
    form.setValue("bbpMonto", bbpMonto);
    form.setValue("bonoVerde", bonoVerdeMonto > 0);
    form.setValue("bonoVerdeMonto", bonoVerdeMonto);
  };

  // Observados/calculados
  const vals = form.watch();

  // Bonos
  const bonos = (vals.bbp ? vals.bbpMonto ?? 0 : 0) + (vals.bonoVerde ? vals.bonoVerdeMonto ?? 0 : 0);

  // Gastos (si financiar = true, se suman al principal)
  const totalGastos = vals.gastosNotariales + vals.gastosRegistrales + vals.tasacionPerito;

  const principalFinanciado = Math.max(
    0,
    vals.precioVenta - vals.cuotaInicial - bonos + (vals.financiarGastos ? totalGastos : 0)
  );

  const {
    i,
    iMensualPct,
    pagoGracia,
    pagoRegular,
    mesesAmort,
    seguroMes1,
    itfMes1,
    cuotaBase,
    tcea,
  } = useSimulacionCalculations({ vals, principalFinanciado, totalGastos });

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
      await saveSimulation({
        userId: user.uid,
        tcea: tcea, // <-- Usar TCEA real
        plazoMeses: vals.plazoMeses,
        monto: principalFinanciado,
        nombre: vals.proyecto || null,
        estado: "En proceso",
        resumen: {
          precioVenta: vals.precioVenta,
          cuotaInicial: vals.cuotaInicial,
          bonos,
          principalFinanciado,
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
          totalGastos,
          financiarGastos: vals.financiarGastos,
          fechaInicio: vals.fechaInicio,
          baseSeguroDesgravamen: vals.baseSeguroDesgravamen,
          tasaDesgravamenMensual: vals.tasaDesgravamenMensual,
        },
        form: vals,
      });
      setMsg("✔ Simulación guardada. La verás en Dashboard e Historial.");
    } catch (e: unknown) {
      console.error(e);
      const message = e instanceof Error ? e.message : "Error al guardar.";
      setMsg(message);
    }
  };

  return (
    <SimulacionForm
      form={form}
      step={step}
      casas={casas}
      selCasa={selCasa}
      onCasaSelect={onCasaSelect}
      goNext={goNext}
      goBack={goBack}
      onCalcular={onCalcular}
      onGuardar={onGuardar}
      msg={msg}
      setStep={setStep}
      hoy={hoy}
      pagoRegular={pagoRegular}
      principalFinanciado={principalFinanciado}
      mesesAmort={mesesAmort}
      iMensualPct={iMensualPct}
      pagoGracia={pagoGracia}
      cuotaBase={cuotaBase}
      seguroMes1={seguroMes1}
      itfMes1={itfMes1}
      totalGastos={totalGastos}
      tcea={tcea} // <-- Pasar TCEA
    />
  );
}
