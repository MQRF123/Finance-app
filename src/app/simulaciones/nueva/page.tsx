"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "@/lib/auth/use-auth";

import { type FormVals, type Casa } from "@/lib/simulacion/types";

import { saveSimulation } from "@/lib/simulacion/services/firebase";
import { useSimulacionCalculations } from "@/lib/simulacion/use-simulacion-calculations";
import { SimulacionForm } from "@/components/simulaciones/SimulacionForm";

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

  const {
    i,
    iMensualPct,
    tea,
    pagoGracia,
    pagoRegular,
    mesesAmort,
    seguroMes1,
    itfMes1,
    cuotaBase,
  } = useSimulacionCalculations({ vals, principalFinanciado });

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
        tcea: tea,
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
          techoPropio: vals.techoPropio,
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
      setSelCasa={setSelCasa}
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
    />
  );
}