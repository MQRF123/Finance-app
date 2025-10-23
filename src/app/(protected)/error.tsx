"use client";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ProtectedError({ error, reset }: Props) {
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold">Ocurrió un error</h1>
      <p className="text-sm text-neutral-700 mt-2">{error.message}</p>
      <button
        onClick={reset}
        className="mt-4 rounded-lg bg-emerald-700 text-white px-4 py-2 text-sm hover:bg-emerald-800"
      >
        Reintentar
      </button>
    </div>
  );
}
