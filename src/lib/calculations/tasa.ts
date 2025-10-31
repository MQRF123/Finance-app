export function teaToMensual(tea: number) {
  return Math.pow(1 + tea, 1 / 12) - 1;
}
