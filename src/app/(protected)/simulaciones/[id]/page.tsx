// src/app/(protected)/simulaciones/[id]/page.tsx

// Next 15 tipa params/searchParams como Promise en .next/types
type Props = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Page({ params }: Props) {
  const { id } = await params; // <— importante

  return (
    <section className="space-y-4">
      <h1 className="text-xl font-semibold">Detalle de simulación</h1>
      <p className="text-sm text-neutral-600">ID: {id}</p>

      <div className="rounded-xl border bg-white p-4">
        <p>Contenido del detalle…</p>
      </div>
    </section>
  );
}
