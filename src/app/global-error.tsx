'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div style={{ padding: '2rem', fontFamily: 'system-ui' }}>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Ocurrió un error</h1>
          <p style={{ marginTop: '.5rem', color: '#444' }}>
            {error?.message ?? 'Error inesperado.'}
          </p>
          <button
            onClick={reset}
            style={{
              marginTop: '1rem',
              background: '#065f46',
              color: 'white',
              borderRadius: 8,
              padding: '.5rem 1rem',
            }}
          >
            Reintentar
          </button>
        </div>
      </body>
    </html>
  );
}
