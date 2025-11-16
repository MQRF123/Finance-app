'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { SimulacionCard } from '@/components/simulaciones/cards/simulacion-card';
import { getAllSimulaciones } from '@/lib/simulacion/services/firebase';
import { useAuth } from '@/lib/auth/use-auth';
import { Simulacion } from '@/lib/simulacion/types';

function ListPage() {
  const { user } = useAuth();
  const [simulaciones, setSimulaciones] = useState<(Simulacion & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      getAllSimulaciones(user.uid)
        .then(setSimulaciones)
        .finally(() => setLoading(false));
    } else {
      // If no user, stop loading and the component will render the login message
      setLoading(false);
    }
  }, [user]);

  if (loading) {
    return (
      <div className="text-center py-10">
        <p className="text-neutral-600">Cargando simulaciones...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-10">
        <p className="text-neutral-600">Debes iniciar sesión para ver tus simulaciones.</p>
        <Link href="/login" className="text-emerald-700 hover:underline mt-2 inline-block">
          Iniciar sesión
        </Link>
      </div>
    );
  }

  if (simulaciones.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-neutral-600">No tienes simulaciones guardadas.</p>
        <Link href="/simulaciones/nueva" className="text-emerald-700 hover:underline mt-2 inline-block">
          Crea una nueva simulación
        </Link>
      </div>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Mis Flujos de Pagos</h1>
          <p className="text-sm text-neutral-600">Tus simulaciones guardadas</p>
        </div>
        <Link
          href="/simulaciones/nueva"
          className="rounded-lg bg-emerald-700 text-white px-3 py-2 text-sm hover:bg-emerald-800"
        >
          Nueva simulación
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {simulaciones.map((sim) => (
          <Link href={`/simulaciones/${sim.id}/cronograma`} key={sim.id}>
            <SimulacionCard
              proyecto={sim.nombre}
              monto={sim.monto}
              plazo={sim.plazoMeses}
              fecha={sim.createdAt}
            />
          </Link>
        ))}
      </div>
    </section>
  );
}

export default ListPage;
