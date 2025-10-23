export default function NotFound() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h1 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Página no encontrada</h1>
      <p style={{ marginTop: '.5rem', color: '#444' }}>
        La ruta que buscas no existe.
      </p>
    </div>
  );
}
