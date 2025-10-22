export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh grid place-items-center p-6
      bg-[radial-gradient(900px_500px_at_10%_-10%,rgba(16,185,129,.12),transparent),
          radial-gradient(900px_500px_at_90%_120%,rgba(0,0,0,.04),transparent)]">
      {children}
    </div>
  );
}
