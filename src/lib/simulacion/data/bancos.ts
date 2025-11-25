export interface BancoInfo {
  id: string;
  nombre: string;
  teaMin: number;
  teaMax: number;
  desgravamenMensual: number;
}

export const BANCOS_PERU: BancoInfo[] = [
  // --- Datos extraídos del Excel del usuario ---
  { id: 'bbva_excel', nombre: 'BBVA (Campaña)', teaMin: 12.9, teaMax: 13.1, desgravamenMensual: 0.0280 },
  { id: 'pichincha_excel', nombre: 'Banco Pichincha (Campaña)', teaMin: 13.0, teaMax: 15.0, desgravamenMensual: 0.0280 },
  { id: 'santander_excel', nombre: 'Santander Perú', teaMin: 12.25, teaMax: 18.5, desgravamenMensual: 0.0280 },
  { id: 'scotiabank_excel', nombre: 'Scotiabank (Campaña)', teaMin: 12.1, teaMax: 12.1, desgravamenMensual: 0.0280 },
  // --- Datos de Mercado (para cubrir rangos estándar no en el Excel) ---
  { id: 'bcp', nombre: 'BCP', teaMin: 9.10, teaMax: 14.00, desgravamenMensual: 0.0285 },
  { id: 'interbank', nombre: 'Interbank', teaMin: 8.34, teaMax: 13.00, desgravamenMensual: 0.0283 },
  { id: 'banbif', nombre: 'BanBif', teaMin: 8.78, teaMax: 15.00, desgravamenMensual: 0.0280 },
  { id: 'bbva_mercado', nombre: 'BBVA (Estándar)', teaMin: 8.04, teaMax: 12.8, desgravamenMensual: 0.0280 },
  { id: 'scotiabank_mercado', nombre: 'Scotiabank (Estándar)', teaMin: 8.25, teaMax: 12.0, desgravamenMensual: 0.0280 },
];
