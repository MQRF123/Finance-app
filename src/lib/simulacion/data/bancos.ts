export interface BancoInfo {
  id: string;
  nombre: string;
  teaMin: number; // Porcentaje (ej. 8.5)
  teaMax: number; // Porcentaje (ej. 15.0)
  desgravamenMensual: number; // Porcentaje mensual (ej. 0.028 para 0.028%)
}

export const BANCOS_PERU: BancoInfo[] = [
  // --- BANCOS CON DATOS DEL EXCEL ---
  { 
    id: 'bbva', 
    nombre: 'BBVA', 
    teaMin: 12.9, 
    teaMax: 13.1, 
    desgravamenMensual: 0.0280 
  },
  { 
    id: 'pichincha', 
    nombre: 'Banco Pichincha', 
    teaMin: 13.0, 
    teaMax: 15.0, 
    desgravamenMensual: 0.0269 
  },
  { 
    id: 'santander', 
    nombre: 'Santander Perú', 
    teaMin: 12.25, 
    teaMax: 18.5, 
    desgravamenMensual: 0.0544 
  },
  { 
    id: 'scotiabank', 
    nombre: 'Scotiabank', 
    teaMin: 12.1, 
    teaMax: 12.1, 
    desgravamenMensual: 0.0280 
  },

  // --- BANCOS RELLENADOS ALEATORIAMENTE (REALISTAS) ---
  { 
    id: 'bcp', 
    nombre: 'Banco de Crédito (BCP)', 
    teaMin: 8.5, 
    teaMax: 14.5, 
    desgravamenMensual: 0.0350 
  },
  { 
    id: 'interbank', 
    nombre: 'Interbank', 
    teaMin: 8.9, 
    teaMax: 15.2, 
    desgravamenMensual: 0.0450 
  },
  { 
    id: 'alfin', 
    nombre: 'Alfin Banco', 
    teaMin: 11.5, 
    teaMax: 19.5, 
    desgravamenMensual: 0.0650 
  },
  { 
    id: 'comercio', 
    nombre: 'Banco de Comercio', 
    teaMin: 9.5, 
    teaMax: 14.0, 
    desgravamenMensual: 0.0320 
  },
  { 
    id: 'nacion', 
    nombre: 'Banco de la Nación', 
    teaMin: 8.0, 
    teaMax: 11.0, 
    desgravamenMensual: 0.0250 
  },
  { 
    id: 'falabella', 
    nombre: 'Banco Falabella', 
    teaMin: 10.5, 
    teaMax: 16.0, 
    desgravamenMensual: 0.0590 
  },
  { 
    id: 'gnb', 
    nombre: 'Banco GNB', 
    teaMin: 9.0, 
    teaMax: 13.5, 
    desgravamenMensual: 0.0290 
  },
  { 
    id: 'ripley', 
    nombre: 'Banco Ripley', 
    teaMin: 12.0, 
    teaMax: 17.5, 
    desgravamenMensual: 0.0600 
  },
  { 
    id: 'mibanco', 
    nombre: 'MiBanco', 
    teaMin: 14.0, 
    teaMax: 22.0, 
    desgravamenMensual: 0.0750 
  },
  { 
    id: 'banbif', 
    nombre: 'BanBif', 
    teaMin: 9.2, 
    teaMax: 14.8, 
    desgravamenMensual: 0.0310 
  }
];