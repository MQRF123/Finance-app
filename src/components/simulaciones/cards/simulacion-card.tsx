import type { Timestamp } from 'firebase/firestore';
import { fmtMoney, fmtDate } from '@/lib/simulacion/utils';

interface SimulacionCardProps {
  proyecto?: string | null;
  monto: number;
  plazo: number;
  fecha?: Timestamp;
}

export function SimulacionCard({ proyecto, monto, plazo, fecha }: SimulacionCardProps) {
  const titulo = proyecto || 'Simulación';
  const fechaFmt = fecha ? fmtDate(fecha) : 'N/A';

  return (
    <div className="text-left rounded-2xl border bg-white p-4 transition hover:shadow-sm w-full h-full">
      <div className="font-medium">{titulo}</div>
      <div className="mt-2 text-2xl font-bold">{fmtMoney(monto)}</div>
      <div className="text-sm text-neutral-600 mt-1">
        {plazo} meses
      </div>
      <div className="text-xs text-neutral-500 mt-2">
        {fechaFmt}
      </div>
    </div>
  );
}
