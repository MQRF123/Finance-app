"use client";

import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { FirebaseError } from "firebase/app";
import Link from "next/link";

function isFirebaseError(e: unknown): e is FirebaseError {
  return typeof e === "object" && e !== null && "code" in e;
}

export default function RegisterPage() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [err, setErr] = useState<string>("");

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErr("");
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (e: unknown) {
      setErr(isFirebaseError(e) ? `${e.code}: ${e.message}` : "No se pudo crear la cuenta.");
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
            className="w-full rounded-lg bg-emerald-700 text-white px-4 py-2 text-sm hover:bg-emerald-800"
          >
            Registrarme
          </button>
        </form>
        <p className="text-xs text-neutral-600">
          ¿Ya tienes cuenta?{" "}
          <Link className="text-emerald-700 font-medium" href="/(auth)/login">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
