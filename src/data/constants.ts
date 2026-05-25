import type { EnergyLabel } from './homes';

// Mortgage cap by energy label (10y vast NHG @ 3.9%, base case "no own money")
// Base = label E or lower. Better label = higher cap.
export const MORTGAGE_CAP_BY_LABEL: Record<EnergyLabel, number> = {
  G: 417_000,
  F: 417_000,
  E: 417_000,
  D: 422_000,
  C: 422_000,
  B: 427_000,
  A: 427_000,
  'A+': 437_000,
  'A++': 437_000,    // assumed same tier as A+
  'A+++': 437_000,
  'A++++': 437_000
};

// For label ranking on the radar (higher = better)
export const LABEL_RANK: Record<EnergyLabel, number> = {
  G: 0, F: 1, E: 2, D: 3, C: 4, B: 5, A: 6, 'A+': 7, 'A++': 8, 'A+++': 9, 'A++++': 10
};

// Default values for the global controls panel
export const DEFAULTS = {
  ratePct: 3.9,
  termYears: 30,
  kostenKoperPct: 2.5,   // makelaar/notaris/taxatie/advies/NHG ~ 2-3% of price (no overdrachtsbelasting)
  ownMoneyBudgetK: 87.5, // €85-90K midpoint
  exitHorizonYears: 8,
  growthPctPerYear: 7.5
};
