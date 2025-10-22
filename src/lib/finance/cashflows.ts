export function npv(rate: number, cfs: number[]): number {
  return cfs.reduce((acc, cf, t) => acc + cf / Math.pow(1 + rate, t), 0);
}

/** IRR mensual (devuelve r tal que NPV(r)=0). Newton con fallback bisección. */
export function irr(cfs: number[], guess = 0.01): number {
  const tol = 1e-8, maxIter = 200;

  const f = (r: number) => cfs.reduce((acc, cf, t) => acc + cf / Math.pow(1 + r, t), 0);
  const df = (r: number) =>
    cfs.reduce((acc, cf, t) => acc + (-t * cf) / Math.pow(1 + r, t + 1), 0);

  // Newton
  let r = guess;
  for (let i = 0; i < maxIter; i++) {
    const fr = f(r), dfr = df(r);
    if (Math.abs(fr) < tol) return r;
    if (dfr === 0) break;
    const step = fr / dfr;
    r = r - step;
    if (!Number.isFinite(r) || r <= -0.9999 || r > 10) break;
  }

  // Bisección en [-0.9, 5]
  let lo = -0.9, hi = 5;
  let flo = f(lo), fhi = f(hi);
  if (flo * fhi > 0) return guess; // sin cambio de signo: devolvemos guess
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    const fmid = f(mid);
    if (Math.abs(fmid) < tol) return mid;
    if (flo * fmid <= 0) { hi = mid; fhi = fmid; } else { lo = mid; flo = fmid; }
  }
  return (lo + hi) / 2;
}
