"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { auth } from "@/lib/firebase";

function mapAuthError(e: FirebaseError | Error): string {
  const code = (e as FirebaseError).code ?? "";
  switch (code) {
    case "auth/email-already-in-use":
      return "Ese correo ya está en uso.";
    case "auth/invalid-email":
      return "El correo no es válido.";
    case "auth/weak-password":
      return "La contraseña es muy débil (mín. 6 caracteres).";
    case "auth/invalid-api-key":
    case "auth/api-key-not-valid.please-pass-a-valid-api-key.":
      return "Tu API key de Firebase no es válida. Revisa tus variables de entorno.";
    default:
      return `${code ? code + ": " : ""}${e.message}`;
  }
}

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      router.replace("/dashboard");
    } catch (e) {
      setErr(mapAuthError(e as FirebaseError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[60vh] grid place-items-center p-6">
      <div className="w-full max-w-sm rounded-2xl border bg-white p-6 space-y-4">
        <h1 className="text-xl font-semibold">Crear cuenta</h1>
        {err && <p className="text-sm text-red-600">{err}</p>}

        <form onSubmit={onSubmit} className="space-y-3">
          <label className="text-sm block">
            Correo
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.currentTarget.value)}
              className="mt-1 w-full rounded-xl border px-3 py-2"
            />
          </label>
          <label className="text-sm block">
            Contraseña
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.currentTarget.value)}
              className="mt-1 w-full rounded-xl border px-3 py-2"
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-emerald-700 text-white px-4 py-2 text-sm hover:bg-emerald-800 disabled:opacity-50"
          >
            Crear cuenta
          </button>
        </form>

        <p className="text-xs text-neutral-600">
          ¿Ya tienes cuenta?{" "}
          {/* 🔥 IMPORTANTE: URL correcta sin el grupo (auth) */}
          <Link className="text-emerald-700 font-medium" href="/login">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
