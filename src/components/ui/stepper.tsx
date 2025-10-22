export function Stepper({ step }: { step: number }) {
  const items = ["Datos", "Costos y Seguros", "Gracia", "Resumen"];
  return (
    <ol className="flex items-center gap-2 text-sm">
      {items.map((label, i) => {
        const idx = i + 1;
        const active = idx === step;
        const done = idx < step;
        return (
          <li key={label} className="flex items-center gap-2">
            <span className={[
              "grid place-items-center h-6 w-6 rounded-full border",
              done ? "bg-emerald-500 border-emerald-500 text-white" :
              active ? "bg-black border-black text-white" :
              "bg-white border-neutral-300 text-neutral-600"
            ].join(" ")}>{idx}</span>
            <span className={`hidden sm:inline ${active ? "font-semibold" : "text-neutral-600"}`}>{label}</span>
            {i < items.length - 1 && <span className="w-8 h-px bg-neutral-300 mx-1" />}
          </li>
        );
      })}
    </ol>
  );
}
