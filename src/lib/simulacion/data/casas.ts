import { type Casa } from "@/lib/simulacion/types";

// 1. Definimos y exportamos el catálogo de casas aquí
export const casas: Casa[] = [
  { id: "c1", titulo: "Casa Miraflores", precio: 250000, m2: 118, eco: true,  distrito: "Miraflores" },
  { id: "c2", titulo: "Casa Surco",       precio: 235000, m2: 112, eco: false, distrito: "Santiago de Surco" },
  { id: "c3", titulo: "Casa Chorrillos",  precio: 199000, m2: 98,  eco: true,  distrito: "Chorrillos" },
  { id: "c4", titulo: "Casa San Miguel",  precio: 185000, m2: 86,  eco: false, distrito: "San Miguel" },
  { id: "c5", titulo: "Casa Comas",       precio: 150000, m2: 76,  eco: false, distrito: "Comas" },
  { id: "c6", titulo: "Casa Magdalena",   precio: 210000, m2: 94,  eco: true,  distrito: "Magdalena del Mar" },
  { id: "c7", titulo: "Casa Ate",         precio: 165000, m2: 80,  eco: false, distrito: "Ate" },
  { id: "c8", titulo: "Casa San Borja",   precio: 245000, m2: 120, eco: true,  distrito: "San Borja" },
];