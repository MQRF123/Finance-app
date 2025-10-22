export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh grid place-items-center bg-[radial-gradient(1200px_600px_at_10%_-20%,rgba(16,185,129,.08),transparent),radial-gradient(1200px_600px_at_90%_120%,rgba(0,0,0,.06),transparent)] p-6">
      <div className="w-full max-w-md bg-white/80 backdrop-blur md:rounded-2xl border shadow-sm p-6">
        {children}
      </div>
    </div>
  );
}
