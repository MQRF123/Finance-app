import { z } from "zod";

export const schema = z.object({
  // Paso 1 – Solicitante
  dni: z.string().min(8, "DNI inválido"),
  nombres: z.string().min(2, "Ingresa el nombre"),
  estadoCivil: z.enum(["Soltero", "Casado", "Conviviente", "Divorciado", "Viudo"]),
  ingresoMensual: z.coerce.number().min(0),
  dependientes: z.coerce.number().min(0).default(0),
  email: z.string().email("Correo inválido"),
  telefono: z.string().min(6, "Teléfono inválido"),
  telefonoAlt: z.string().optional(),

  // Paso 2 – Vivienda
  tipoInmueble: z.enum(["Casa", "Departamento", "Terreno", "Otro"]),
  departamento: z.string().min(2),
  proyecto: z.string().min(2),
  precioVenta: z.coerce.number().min(0),

  // Paso 3 – Condiciones
  moneda: z.enum(["PEN", "USD"]).default("PEN"),
  tipoTasa: z.enum(["TEA", "TNA"]).default("TEA"),
  tasaValor: z.coerce.number().min(0.0001),
  capitalizacion: z.coerce.number().min(1).default(12),
  plazoMeses: z.coerce.number().min(1),
  graciaTipo: z.enum(["sin", "parcial", "total"]).default("sin"),
  graciaMeses: z.coerce.number().min(0).default(0),

  // Costos / seguros
  desgravamenMensualSoles: z.coerce.number().min(0).default(0),
  adminInicialSoles: z.coerce.number().min(0).default(0),

  // Bonos / inicial
  bbp: z.boolean().default(false),
  bbpMonto: z.coerce.number().min(0).default(0),
  bonoVerde: z.boolean().default(false),
  bonoVerdeMonto: z.coerce.number().min(0).default(0),
  cuotaInicial: z.coerce.number().min(0).default(0),
});

export type FormValues = z.infer<typeof schema>;

export const defaultVals: FormValues = {
  dni: "",
  nombres: "",
  estadoCivil: "Soltero",
  ingresoMensual: 0,
  dependientes: 0,
  email: "",
  telefono: "",
  telefonoAlt: "",

  tipoInmueble: "Departamento",
  departamento: "Lima",
  proyecto: "",
  precioVenta: 0,

  moneda: "PEN",
  tipoTasa: "TEA",
  tasaValor: 0.1,
  capitalizacion: 12,
  plazoMeses: 240,
  graciaTipo: "sin",
  graciaMeses: 0,

  desgravamenMensualSoles: 0,
  adminInicialSoles: 0,

  bbp: false,
  bbpMonto: 0,
  bonoVerde: false,
  bonoVerdeMonto: 0,
  cuotaInicial: 0,
};
