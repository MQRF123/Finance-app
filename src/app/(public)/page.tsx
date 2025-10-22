import { Calculator, ShieldCheck, FileText, BarChart3 } from "lucide-react";

export default function LandingPage() {
  return (
    <main className="min-h-dvh bg-gradient-to-b from-neutral-50 to-white">
      <section className="relative overflow-hidden">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-black/5 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs text-neutral-600 bg-white/70 backdrop-blur">
              <ShieldCheck className="h-3.5 w-3.5" />
              MiVivienda · Cálculo TCEA con costos reales
            </span>
            <h1 className="mt-4 text-4xl md:text-5xl font-bold tracking-tight">
              Simula tu crédito MiVivienda con <span className="underline decoration-emerald-400">TCEA real</span>
            </h1>
            <p className="mt-3 text-neutral-600 md:text-lg">
              Incluye seguro de desgravamen, gastos notariales y registrales, tasación (GBN) e ITF 0.005%. Exporta cronograma y reportes.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <a href="/login" className="inline-flex items-center justify-center rounded-xl bg-black text-white px-5 py-3">
                Empezar ahora
              </a>
              <a href="#features" className="inline-flex items-center justify-center rounded-xl border px-5 py-3">
                Ver características
              </a>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="max-w-6xl mx-auto px-6 pb-16">
        <div className="grid md:grid-cols-3 gap-4">
          <div className="rounded-2xl border bg-white p-5">
            <Calculator className="h-6 w-6" />
            <h3 className="mt-3 font-semibold">Cronograma francés</h3>
            <p className="text-sm text-neutral-600 mt-1">
              Cuota, interés, amortización, seguro, ITF y cuota total con base saldo o saldo promedio.
            </p>
          </div>
          <div className="rounded-2xl border bg-white p-5">
            <BarChart3 className="h-6 w-6" />
            <h3 className="mt-3 font-semibold">TCEA desde TIR mensual</h3>
            <p className="text-sm text-neutral-600 mt-1">
              Flujos reales del cliente: desembolso neto t₀ vs. pagos mensuales (costos incluidos).
            </p>
          </div>
          <div className="rounded-2xl border bg-white p-5">
            <FileText className="h-6 w-6" />
            <h3 className="mt-3 font-semibold">Reportes PDF</h3>
            <p className="text-sm text-neutral-600 mt-1">
              Exporta el detalle de la simulación y el cronograma listo para entregar.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
