import { LABEL_RANK } from '../data/constants';
import type { Home } from '../data/homes';
import { mortgageCap } from './finance';

export interface DerivedMetrics {
  pricePerM2: number;
  wozGrowth23to25Pct: number;        // % growth WOZ 2023→2025
  wozVsAskPct: number;               // most recent WOZ vs ask
  huispediaVsAskPct: number;         // huispedia p60 vs ask (<0 = ask > p60 = "expensive")
  valueHeadroomEUR: number;          // huispedia p60 − ask  (positive = upside)
  popularityScore: number;           // 0..1 (higher = colder = better for buyer)
  fitsInMortgageCap: boolean;
}

/**
 * Popularity score: lower views/day or longer days-on-funda = COLDER = better for buyer.
 * Returns 0..1 (1 = coldest in the dataset).
 */
export function popularityScores(homes: Home[]): Record<string, number> {
  const days = homes.map((h) => h.popularity.daysOnFunda ?? 0);
  const minD = Math.min(...days);
  const maxD = Math.max(...days);
  const span = maxD - minD || 1;
  const out: Record<string, number> = {};
  for (const h of homes) {
    const d = h.popularity.daysOnFunda ?? 0;
    out[h.id] = (d - minD) / span;
  }
  return out;
}

export function derive(home: Home, popScore: number): DerivedMetrics {
  const ask = home.askPrice;
  const woz25 = home.woz['2025'];
  const woz23 = home.woz['2023'];
  return {
    pricePerM2: ask / home.m2,
    wozGrowth23to25Pct: ((woz25 - woz23) / woz23) * 100,
    wozVsAskPct: ((woz25 - ask) / ask) * 100,
    huispediaVsAskPct: ((home.huispedia.p60 - ask) / ask) * 100,
    valueHeadroomEUR: home.huispedia.p60 - ask,
    popularityScore: popScore,
    fitsInMortgageCap: ask <= mortgageCap(home.energyLabel)
  };
}

/** Normalise a home's stats to a 0..1 radar polygon */
export function radarVector(
  home: Home,
  derived: DerivedMetrics,
  allHomes: Home[],
  allDerived: DerivedMetrics[]
): { metric: string; value: number; raw: string }[] {
  const norm = (val: number, vals: number[], reverse = false) => {
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    if (max === min) return 0.5;
    const v = (val - min) / (max - min);
    return reverse ? 1 - v : v;
  };

  return [
    {
      metric: 'm²',
      value: norm(home.m2, allHomes.map((h) => h.m2)),
      raw: `${home.m2} m²`
    },
    {
      metric: 'Label',
      value: norm(LABEL_RANK[home.energyLabel], allHomes.map((h) => LABEL_RANK[h.energyLabel])),
      raw: home.energyLabel
    },
    {
      metric: 'Lage VvE',
      value: norm(home.vveMonthly, allHomes.map((h) => h.vveMonthly), true),
      raw: `€${home.vveMonthly}/mnd`
    },
    {
      metric: 'Parking',
      value: home.ownParking ? 1 : 0,
      raw: home.ownParking ? 'ja' : 'nee'
    },
    {
      metric: 'Waarde-marge',
      value: norm(derived.valueHeadroomEUR, allDerived.map((d) => d.valueHeadroomEUR)),
      raw: `€${Math.round(derived.valueHeadroomEUR / 1000)}K`
    },
    {
      metric: 'Koel (niet hot)',
      value: derived.popularityScore,
      raw: `${home.popularity.daysOnFunda ?? '?'} dagen`
    },
    {
      metric: 'Lage €/m²',
      value: norm(derived.pricePerM2, allDerived.map((d) => d.pricePerM2), true),
      raw: `€${Math.round(derived.pricePerM2)}`
    },
    {
      metric: 'Nieuwbouw',
      value: norm(home.bouwjaar, allHomes.map((h) => h.bouwjaar)),
      raw: `${home.bouwjaar}`
    }
  ];
}
