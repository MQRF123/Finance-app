import "./globals.css";
import { Providers } from "./providers";
import { Inter } from "next/font/google";
const inter = Inter({ subsets: ["latin"] });

export const metadata = { title: "MiVivienda – Simulador", description: "Simula tu crédito MiVivienda con TCEA real" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${inter.className} min-h-dvh bg-gradient-to-b from-neutral-50 to-white text-neutral-900`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
