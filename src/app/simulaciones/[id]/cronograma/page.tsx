// ejemplo: src/app/(protected)/simulaciones/[id]/page.tsx
type Props = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Page({ params }: Props) {
  const { id } = await params;
  return (
    <section className="space-y-4">
      <h1 className="text-xl font-semibold">Detalle de simulación</h1>
      <p className="text-sm text-neutral-600">ID: {id}</p>
    </section>
  );
}
