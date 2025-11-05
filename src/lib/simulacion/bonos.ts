export function calcularBonoBuenPagador(precioVenta: number): number {
  if (precioVenta >= 70000 && precioVenta <= 95000) {
    return 25700;
  }
  if (precioVenta > 95000 && precioVenta <= 140000) {
    return 21300;
  }
  if (precioVenta > 140000 && precioVenta <= 232000) {
    return 17100;
  }
  if (precioVenta > 232000 && precioVenta <= 343900) {
    return 12800;
  }
  return 0;
}

export function calcularBonoVerde(precioVenta: number, esEco: boolean): number {
  if (!esEco) {
    return 0;
  }
  return Math.min(precioVenta * 0.01, 12000);
}
