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
  
  // CORRECCIÓN: Permitir porcentajes enteros (ej. 9, 10.5, 15)
  // Antes validaba decimales pequeños, ahora permite hasta 100%
  tasaValor: z.coerce.number()
    .min(0.0001, "La tasa debe ser mayor a 0")
    .max(100, "La tasa no puede ser mayor al 100%"),

  plazoMeses: z.coerce.number().min(1),
  graciaTipo: z.enum(["sin", "parcial", "total"]).default("sin"),
  graciaMeses: z.coerce.number().min(0).default(0),

  // Costos / seguros
  // CORRECCIÓN: Permitir porcentajes (ej. 0.028, 0.3, etc) sin límite decimal estricto
  tasaDesgravamenMensual: z.coerce.number()
    .min(0)
    .max(100, "El seguro no puede ser mayor al 100%")
    .default(0),
    
  baseSeguroDesgravamen: z.enum(["saldo", "saldo_promedio"]).default("saldo"), // Agregué esto que faltaba en tu snippet anterior para evitar errores de tipo

  // Gastos iniciales (Agregados para que coincidan con tu formulario completo)
  gastosNotariales: z.coerce.number().min(0).default(0),
  gastosRegistrales: z.coerce.number().min(0).default(0),
  tasacionPerito: z.coerce.number().min(0).default(0),
  financiarGastos: z.boolean().default(false),
  fechaInicio: z.string().optional(), // Para la fecha

  desgravamenMensualSoles: z.coerce.number().min(0).default(0), // Legacy?
  adminInicial: z.coerce.number().min(0).default(0), // Renombrado de adminInicialSoles para coincidir con tu formulario

  // Bonos / inicial
  bbp: z.boolean().default(false),
  bbpMonto: z.coerce.number().min(0).default(0),
  bonoVerde: z.boolean().default(false),
  bonoVerdeMonto: z.coerce.number().min(0).default(0),
  cuotaInicial: z.coerce.number().min(0).default(0),
  
  // CORRECCIÓN: COK por defecto en 20 (entero)
  cokValor: z.coerce.number().min(0).default(20),
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
  // CORRECCIÓN: Valor por defecto 10 (10%) en lugar de 0.1
  tasaValor: 10, 
  plazoMeses: 240,
  graciaTipo: "sin",
  graciaMeses: 0,

  // CORRECCIÓN: Valor por defecto 0.028 (típico mercado) o 0
  tasaDesgravamenMensual: 0, 
  baseSeguroDesgravamen: "saldo",

  gastosNotariales: 0,
  gastosRegistrales: 0,
  tasacionPerito: 0,
  financiarGastos: false,

  desgravamenMensualSoles: 0,
  adminInicial: 0,

  bbp: false,
  bbpMonto: 0,
  bonoVerde: false,
  bonoVerdeMonto: 0,
  cuotaInicial: 0,
  
  // CORRECCIÓN: Valor por defecto 20 (20%)
  cokValor: 20,
};