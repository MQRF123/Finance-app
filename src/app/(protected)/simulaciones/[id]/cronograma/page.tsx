// src/app/(protected)/simulaciones/[id]/cronograma/page.tsx

// Next 15 (con PPR) tipa params/searchParams como Promise<...> en .next/types
type Props = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

// Página async para poder hacer await a params
export default async function Page({ params }: Props) {
  const { id } = await params; // ⬅️ importante

  return (
    <section className="space-y-4">
      <h1 className="text-xl font-semibold">Cronograma</h1>
      <p className="text-sm text-neutral-600">ID: {id}</p>

      <div className="rounded-xl border bg-white p-4">
        <p>Aquí irá la tabla del cronograma…</p>
      </div>
    </section>
  );
}
