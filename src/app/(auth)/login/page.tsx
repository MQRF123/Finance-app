"use client";

import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";

const schema = z.object({
  email: z.string().email("Correo inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});
type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const [show, setShow] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { isSubmitting, errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (v: FormValues) => {
    try {
      await signInWithEmailAndPassword(auth, v.email, v.password);
      router.replace("/dashboard");
    } catch (e: any) {
      toast.error(e?.message ?? "Error de autenticación");
    }
  };

  const onGoogle = async () => {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
      router.replace("/dashboard");
    } catch (e: any) {
      toast.error(e?.message ?? "No se pudo ingresar con Google");
    }
  };

  const resetPw = async () => {
    const email = getValues("email");
    if (!email) return toast.info("Escribe tu correo primero");
    await sendPasswordResetEmail(auth, email);
    toast.success("Te enviamos un enlace para restablecer tu contraseña");
  };

  return (
    <main className="w-full max-w-5xl rounded-3xl overflow-hidden border shadow-lg bg-white">
      <div className="grid md:grid-cols-2">
        {/* ILUSTRACIÓN */}
        <div className="relative hidden md:block">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-emerald-100" />
          <div className="relative h-full grid place-items-center p-10">
            <HouseKeysSVG className="max-w-[420px] w-full h-auto" />
          </div>
        </div>

        {/* FORMULARIO */}
        <div className="p-8 md:p-10">
          <h1 className="text-3xl font-bold text-emerald-900">MiVivienda</h1>
          <h2 className="mt-1 text-lg font-semibold">Iniciar sesión</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 grid gap-4">
            <label className="text-sm">
              Correo
              <input
                type="email"
                className="mt-1 w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 ring-emerald-200"
                {...register("email")}
              />
              {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>}
            </label>

            <label className="text-sm">
              Contraseña
              <div className="mt-1 flex items-center gap-2 rounded-xl border px-3 focus-within:ring-2 ring-emerald-200">
                <input
                  type={show ? "text" : "password"}
                  className="py-2 w-full outline-none"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  className="p-1 text-neutral-500"
                  aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password.message}</p>}
            </label>

            <button type="button" onClick={resetPw} className="text-sm text-emerald-700 underline self-start">
              ¿Olvidaste tu contraseña?
            </button>

            <button
              disabled={isSubmitting}
              className="rounded-xl bg-emerald-700 text-white py-2.5 hover:bg-emerald-800 disabled:opacity-60"
            >
              {isSubmitting ? "Ingresando…" : "Iniciar sesión"}
            </button>

            <button
              type="button"
              onClick={onGoogle}
              className="rounded-xl border py-2.5 hover:bg-neutral-50"
            >
              Continuar con Google
            </button>

            <div className="text-sm text-neutral-700">
              ¿No tienes una cuenta?{" "}
              <Link href="/register" className="text-emerald-700 font-medium">
                Regístrate
              </Link>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}

function HouseKeysSVG({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 420 280" className={className}>
      <rect x="0" y="160" width="420" height="120" fill="#c7eedb" />
      <g transform="translate(40,40)">
        <rect x="0" y="60" width="170" height="120" rx="6" fill="#0f9d69" />
        <polygon points="85,-5 0,60 170,60" fill="#157a5b" />
        <rect x="25" y="100" width="30" height="35" rx="3" fill="#e7fff3" />
        <rect x="75" y="100" width="30" height="35" rx="3" fill="#e7fff3" />
        <rect x="125" y="100" width="30" height="35" rx="3" fill="#e7fff3" />
        <rect x="75" y="135" width="30" height="45" rx="3" fill="#e7fff3" />
      </g>
      <g transform="translate(260,155) rotate(-10)">
        <circle cx="30" cy="30" r="28" fill="#79c79a" />
        <rect x="25" y="25" width="10" height="50" rx="3" fill="#4ca671" />
        <rect x="40" y="32" width="10" height="45" rx="3" fill="#4ca671" />
      </g>
    </svg>
  );
}
