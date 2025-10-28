import { irr } from './cashflows';

export interface CashFlow {
  amount: number; // always positive
  type: 'income' | 'expense';
}

export function calculateTCEA(cashflows: CashFlow[]): number {
  const amounts = cashflows.map(cf => cf.type === 'income' ? cf.amount : -cf.amount);
  const tir = irr(amounts);
  const tcea = Math.pow(1 + tir, 12) - 1;
  return tcea;
}

export function calculateTotalCost(cashflows: CashFlow[]): number {
  const totalCost = cashflows.reduce((acc, cf) => {
    if (cf.type === 'expense') {
      return acc + cf.amount;
    }
    return acc;
  }, 0);
  return totalCost;
}