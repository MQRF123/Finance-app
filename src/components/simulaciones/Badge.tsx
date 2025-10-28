
import { type Estado } from '@/lib/simulacion/types';

export function Badge({ estado }: { estado: Estado }) {
  const map: Record<Exclude<Estado, undefined>, string> = {
    Aprobado: "bg-emerald-100 text-emerald-800 border-emerald-200",
    "En proceso": "bg-amber-100 text-amber-800 border-amber-200",
    Rechazado: "bg-rose-100 text-rose-800 border-rose-200",
  };
  if (!estado) return <span className="text-neutral-500">—</span>;
  return (
    <span className={`text-xs px-2 py-1 rounded-full border ${map[estado]}`}>
      {estado}
    </span>
  );
}
