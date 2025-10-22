"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";

const schema = z.object({
  name: z.string().min(2, "Ingresa tu nombre"),
  dni: z.string().min(8, "DNI inválido").max(12),
  email: z.string().email("Correo inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
  confirm: z.string().min(6, "Confirma tu contraseña"),
  terms: z.literal(true, { errorMap: () => ({ message: "Debes aceptar los términos" }) })
}).refine(d => d.password === d.confirm, { path: ["confirm"], message: "Las contraseñas no coinciden" });

type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const { register, handleSubmit, formState: { isSubmitting, errors } } =
    useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (v: FormValues) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, v.email, v.password);
      await updateProfile(cred.user, { displayName: v.name });
      toast.success("Cuenta creada");
      router.replace("/dashboard");
    } catch (e: any) {
      toast.error(e?.message ?? "No se pudo crear la cuenta");
    }
  };

  return (
    <main className="min-h-dvh grid place-items-center bg-emerald-100">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow border overflow-hidden">
        <div className="grid md:grid-cols-[240px,1fr]">
          <aside className="bg-emerald-800 text-white p-6">
            <div className="text-lg font-semibold">MiVivienda</div>
          </aside>
          <div className="p-8 md:p-10">
            <h2 className="text-2xl font-bold">Registro</h2>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-6 grid gap-3">
              <Field label="Nombres y apellidos" error={errors.name?.message}>
                <input className="w-full rounded-lg border px-3 py-2" {...register("name")} />
              </Field>
              <Field label="DNI" error={errors.dni?.message}>
                <input className="w-full rounded-lg border px-3 py-2" {...register("dni")} />
              </Field>
              <Field label="Correo" error={errors.email?.message}>
                <input type="email" className="w-full rounded-lg border px-3 py-2" {...register("email")} />
              </Field>
              <Field label="Contraseña" error={errors.password?.message}>
                <input type="password" className="w-full rounded-lg border px-3 py-2" {...register("password")} />
              </Field>
              <Field label="Confirmar contraseña" error={errors.confirm?.message}>
                <input type="password" className="w-full rounded-lg border px-3 py-2" {...register("confirm")} />
              </Field>

              <label className="mt-1 flex items-center gap-2 text-sm">
                <input type="checkbox" {...register("terms")} />
                <span>Acepto los términos y condiciones</span>
              </label>
              {errors.terms && <p className="text-xs text-red-600">{errors.terms.message}</p>}

              <button disabled={isSubmitting} className="mt-2 rounded-lg bg-emerald-700 text-white py-2.5 hover:bg-emerald-800 disabled:opacity-60">
                {isSubmitting ? "Creando cuenta…" : "Crear cuenta"}
              </button>

              <div className="text-sm text-neutral-700">
                ¿Ya tienes cuenta?{" "}
                <Link href="/login" className="text-emerald-700 font-medium">Inicia sesión</Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="text-sm">
      {label}
      <div className="mt-1">{children}</div>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </label>
  );
}
