import { MORTGAGE_CAP_BY_LABEL } from '../data/constants';
import type { EnergyLabel, Home } from '../data/homes';

export function mortgageCap(label: EnergyLabel): number {
  return MORTGAGE_CAP_BY_LABEL[label];
}

export function kostenKoper(bid: number, kostenKoperPct: number): number {
  return Math.round(bid * (kostenKoperPct / 100));
}

/**
 * Eigen geld nodig:
 *   = bid − min(bid, mortgageCap, taxatieValue)   ← combined cap/taxatie gap
 *   + kosten koper (notaris, taxatie, advies, NHG, etc.)
 *
 * taxatieShortfallPct = % under bid the taxatie comes in (0 = best case, taxatie = bid).
 */
export function eigenGeldNeeded(
  bid: number,
  label: EnergyLabel,
  kostenKoperPct: number,
  taxatieShortfallPct: number = 0
): {
  gap: number;
  capGap: number;
  taxatieGap: number;
  kk: number;
  total: number;
  mortgage: number;
} {
  const cap = mortgageCap(label);
  const taxatie = bid * (1 - taxatieShortfallPct / 100);
  const mortgage = Math.min(bid, cap, taxatie);
  const gap = bid - mortgage;
  const capGap = Math.max(0, bid - cap);
  // taxatie shortfall only matters if taxatie ends up below the cap-bound mortgage
  const capBound = Math.min(bid, cap);
  const taxatieGap = Math.max(0, capBound - taxatie);
  const kk = kostenKoper(bid, kostenKoperPct);
  return { gap, capGap, taxatieGap, kk, total: gap + kk, mortgage };
}

export function mortgagePrincipal(
  bid: number,
  label: EnergyLabel,
  taxatieShortfallPct: number = 0
): number {
  const taxatie = bid * (1 - taxatieShortfallPct / 100);
  return Math.min(bid, mortgageCap(label), taxatie);
}

/** Annuity payment (Dutch annuïtair) — monthly */
export function monthlyMortgage(
  principal: number,
  annualRatePct: number,
  termYears: number = 30
): number {
  if (principal <= 0) return 0;
  const r = annualRatePct / 100 / 12;
  const n = termYears * 12;
  if (r === 0) return principal / n;
  return (principal * r) / (1 - Math.pow(1 + r, -n));
}

/** Remaining principal on an annuity loan after `monthsPaid` months */
export function remainingPrincipal(
  principal: number,
  annualRatePct: number,
  termYears: number,
  monthsPaid: number
): number {
  if (principal <= 0) return 0;
  const r = annualRatePct / 100 / 12;
  const n = termYears * 12;
  const m = Math.min(monthsPaid, n);
  if (r === 0) return principal * (1 - m / n);
  const monthly = (principal * r) / (1 - Math.pow(1 + r, -n));
  return principal * Math.pow(1 + r, m) - monthly * ((Math.pow(1 + r, m) - 1) / r);
}

/** Projected sale price at exit (compound growth) */
export function projectedSalePrice(
  bid: number,
  annualGrowthPct: number,
  years: number
): number {
  return bid * Math.pow(1 + annualGrowthPct / 100, years);
}

/** Net cash at exit = sale price − remaining mortgage − exit costs (~2% makelaar) */
export function netAtExit(
  bid: number,
  label: EnergyLabel,
  ratePct: number,
  termYears: number,
  growthPctPerYear: number,
  years: number,
  exitCostPct: number = 2,
  taxatieShortfallPct: number = 0
): number {
  const principal = mortgagePrincipal(bid, label, taxatieShortfallPct);
  const remaining = remainingPrincipal(principal, ratePct, termYears, years * 12);
  const sale = projectedSalePrice(bid, growthPctPerYear, years);
  const exitCost = sale * (exitCostPct / 100);
  return sale - remaining - exitCost;
}

/** Total monthly housing cost = mortgage + VvE + utilities */
export function totalMonthly(
  home: Home,
  bid: number,
  ratePct: number,
  termYears: number,
  taxatieShortfallPct: number = 0
): { mortgage: number; vve: number; utilities: number; total: number } {
  const principal = mortgagePrincipal(bid, home.energyLabel, taxatieShortfallPct);
  const mortgage = monthlyMortgage(principal, ratePct, termYears);
  const vve = home.vveMonthly;
  const e = home.monthlyExtras ?? {};
  const utilities =
    (e.gas ?? 0) + (e.electricity ?? 0) + (e.water ?? 0) + (e.otherFixed ?? 0);
  return { mortgage, vve, utilities, total: mortgage + vve + utilities };
}

export const fmtEUR = (n: number, frac = 0) =>
  n.toLocaleString('nl-NL', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: frac,
    maximumFractionDigits: frac
  });

export const fmtEURk = (n: number) => `€${Math.round(n / 1000)}K`;
