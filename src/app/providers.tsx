"use client";
import { Toaster } from "sonner";
import { AuthProvider } from "@/context/auth-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <Toaster richColors />
    </AuthProvider>
  );
}
