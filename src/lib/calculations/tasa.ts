export function teaToMensual(tea: number) {
  return Math.pow(1 + tea, 1 / 12) - 1;
}
export function tnaToMensual(tna: number, m: number) {
  const tea = Math.pow(1 + tna / m, m) - 1;
  return teaToMensual(tea);
}
