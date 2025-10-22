"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { simulacionSchema } from "@/lib/validation/simulacion";
import type { z } from "zod";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ITF } from "@/config/app";
import { Stepper } from "@/components/ui/stepper";
import { calcularTCEA } from "@/lib/finance/tcea";

type FormValues = z.infer<typeof simulacionSchema>;

export default function NuevaSimulacionPage() {
  const { user } = useAuth();
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(simulacionSchema),
    defaultValues: {
      nombre: "",
      principal: 150000,
      nMeses: 240,
      tea: 0.10,
      tasaDesgravamenMensual: 0.0004,
      baseSeguroDesgravamen: "saldo",
      gastosNotariales: 1200,
      gastosRegistrales: 600,
      tasacionPerito: 450,
      itfPorcentaje: ITF,
      financiarGastos: false,
      mesesGracia: 0,
      tipoGracia: "sin",
    },
  });

  // ✅ Importa y usa useState “normal” y tipado
  const [step, setStep] = useState<number>(1);

  const next = async () => {
    const sections: Record<number, (keyof FormValues)[]> = {
      1: ["nombre", "principal", "nMeses", "tea"],
      2: [
        "tasaDesgravamenMensual",
        "baseSeguroDesgravamen",
        "gastosNotariales",
        "gastosRegistrales",
        "tasacionPerito",
        "financiarGastos",
      ],
      3: ["mesesGracia", "tipoGracia"],
    };
    if (sections[step]) {
      const ok = await form.trigger(sections[step], { shouldFocus: true });
      if (!ok) return;
    }
    // ✅ Evita “implicit any” tipando el parámetro
    setStep((s: number) => Math.min(4, s + 1));
  };

  const back = () => setStep((s: number) => Math.max(1, s - 1));

  const onSubmit = async (v: FormValues) => {
    if (!user) return;
    try {
      const { tcea } = calcularTCEA(v);
      const ref = await addDoc(collection(db, "simulaciones"), {
        ...v,
        tcea,
        uid: user.uid,
        createdAt: serverTimestamp(),
      });
      toast.success("Simulación creada");
      router.replace(`/simulaciones/${ref.id}`);
    } catch (e: any) {
      toast.error(e?.message ?? "No se pudo guardar");
    }
  };

  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Nueva simulación</h1>
        <Stepper step={step} />
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
        {step === 1 && (
          <div className="rounded-2xl border bg-white p-6 grid gap-4">
            <h2 className="font-semibold">Datos del crédito</h2>
            <div className="grid md:grid-cols-2 gap-3">
              <Field label="Nombre" reg={form.register("nombre")} />
              <Field label="Principal (S/)" type="number" step="0.01" reg={form.register("principal", { valueAsNumber: true })} />
              <Field label="Plazo (meses)" type="number" reg={form.register("nMeses", { valueAsNumber: true })} />
              <Field label="TEA (proporción)" type="number" step="0.0001" reg={form.register("tea", { valueAsNumber: true })} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="rounded-2xl border bg-white p-6 grid gap-4">
            <h2 className="font-semibold">Costos y Seguros</h2>
            <div className="grid md:grid-cols-2 gap-3">
              <Field label="Tasa desgravamen mensual" type="number" step="0.000001" reg={form.register("tasaDesgravamenMensual", { valueAsNumber: true })} />
              <label className="text-sm">
                Base del seguro
                <select className="mt-1 w-full border rounded-lg px-3 py-2" {...form.register("baseSeguroDesgravamen")}>
                  <option value="saldo">saldo</option>
                  <option value="saldo_promedio">saldo_promedio</option>
                </select>
              </label>
              <Field label="Gastos notariales (S/)" type="number" step="0.01" reg={form.register("gastosNotariales", { valueAsNumber: true })} />
              <Field label="Gastos registrales (S/)" type="number" step="0.01" reg={form.register("gastosRegistrales", { valueAsNumber: true })} />
              <Field label="Tasación perito (S/)" type="number" step="0.01" reg={form.register("tasacionPerito", { valueAsNumber: true })} />
              <label className="text-sm">
                ITF (0.005% fijo)
                <input disabled value={ITF} className="mt-1 w-full border rounded-lg px-3 py-2 bg-neutral-100" />
              </label>
              <label className="mt-2 flex items-center gap-2 text-sm">
                <input type="checkbox" {...form.register("financiarGastos")} /> Financiar gastos
              </label>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="rounded-2xl border bg-white p-6 grid gap-4">
            <h2 className="font-semibold">Periodo de gracia</h2>
            <div className="grid md:grid-cols-2 gap-3">
              <Field label="Meses de gracia" type="number" reg={form.register("mesesGracia", { valueAsNumber: true })} />
              <label className="text-sm">
                Tipo de gracia
                <select className="mt-1 w-full border rounded-lg px-3 py-2" {...form.register("tipoGracia")}>
                  <option value="sin">sin</option>
                  <option value="parcial">parcial (solo intereses)</option>
                  <option value="total">total (sin pagos)</option>
                </select>
              </label>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="rounded-2xl border bg-white p-6 grid gap-4">
            <h2 className="font-semibold">Resumen</h2>
            <p className="text-sm text-neutral-600">Revisa los datos antes de guardar.</p>
            <div className="grid md:grid-cols-2 gap-3 text-sm">
              {Object.entries(form.getValues()).map(([k, v]) => (
                <div key={k} className="flex justify-between border rounded-lg px-3 py-2 bg-neutral-50">
                  <span className="text-neutral-600">{k}</span>
                  <span className="font-medium">{String(v)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-between">
          <button type="button" onClick={back} disabled={step === 1} className="rounded-xl border px-4 py-2 disabled:opacity-50">
            Atrás
          </button>
          {step < 4 ? (
            <button type="button" onClick={next} className="rounded-xl bg-black text-white px-4 py-2">
              Siguiente
            </button>
          ) : (
            <button type="submit" className="rounded-xl bg-emerald-600 text-white px-4 py-2">
              Guardar simulación
            </button>
          )}
        </div>
      </form>
    </section>
  );
}

// Tipado simple para evitar “implicit any” en Field
type FieldProps = {
  label: string;
  reg: any;
  type?: string;
  step?: string;
};

function Field({ label, reg, type = "text", step }: FieldProps) {
  return (
    <label className="text-sm">
      {label}
      <input type={type} step={step} className="mt-1 w-full border rounded-lg px-3 py-2" {...reg} />
    </label>
  );
}
