import { LABEL_RANK } from '../data/constants';
import type { Home } from '../data/homes';
import { mortgageCap } from './finance';

export type HeatLevel = 'cold' | 'medium' | 'hot' | 'on-fire';

export interface DerivedMetrics {
  pricePerM2: number;
  wozGrowth23to25Pct: number | null;
  wozVsAskPct: number | null;
  huispediaVsAskPct: number | null;
  valueHeadroomEUR: number | null;     // huispedia p60 − ask
  viewsPerDay: number | null;
  heat: HeatLevel;
  /** Suggested bid % of ask based on heat */
  suggestedBidPctRange: [number, number];
  fitsInMortgageCap: boolean;
}

const heatFromViewsPerDay = (vpd: number | null): HeatLevel => {
  if (vpd === null) return 'medium';
  if (vpd < 130) return 'cold';
  if (vpd < 200) return 'medium';
  if (vpd < 300) return 'hot';
  return 'on-fire';
};

const bidRangeFor = (heat: HeatLevel): [number, number] => {
  switch (heat) {
    case 'cold':    return [93, 98];
    case 'medium':  return [98, 102];
    case 'hot':     return [100, 105];
    case 'on-fire': return [103, 108];
  }
};

export function derive(home: Home): DerivedMetrics {
  const ask = home.askPrice;
  const days = home.popularity.daysOnFunda ?? 0;
  const viewsTotal = home.popularity.viewsTotal;
  const viewsPerDay = viewsTotal && days > 0 ? viewsTotal / days : null;
  const heat = heatFromViewsPerDay(viewsPerDay);

  const woz25 = home.woz?.['2025'];
  const woz23 = home.woz?.['2023'];
  const p60 = home.huispedia?.p60;

  return {
    pricePerM2: ask / home.m2,
    wozGrowth23to25Pct:
      woz25 != null && woz23 != null ? ((woz25 - woz23) / woz23) * 100 : null,
    wozVsAskPct: woz25 != null ? ((woz25 - ask) / ask) * 100 : null,
    huispediaVsAskPct: p60 != null ? ((p60 - ask) / ask) * 100 : null,
    valueHeadroomEUR: p60 != null ? p60 - ask : null,
    viewsPerDay,
    heat,
    suggestedBidPctRange: bidRangeFor(heat),
    fitsInMortgageCap: ask <= mortgageCap(home.energyLabel)
  };
}

export const HEAT_COLOR: Record<HeatLevel, string> = {
  cold:      '#60a5fa',
  medium:    '#a78bfa',
  hot:       '#fbbf24',
  'on-fire': '#f87171'
};

export const HEAT_LABEL: Record<HeatLevel, string> = {
  cold:      'Koud',
  medium:    'Gemiddeld',
  hot:       'Heet',
  'on-fire': 'Vuur'
};

/**
 * Radar vector — quality metrics only.
 * Popularity is NOT included (it's a market metric, not a home-quality metric).
 */
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

  // Value headroom — use 0 fallback so homes without huispedia don't break the axis
  const headroomVals = allDerived.map((d) => d.valueHeadroomEUR ?? 0);

  return [
    { metric: 'm²',           value: norm(home.m2, allHomes.map((h) => h.m2)),                    raw: `${home.m2} m²` },
    { metric: 'Label',        value: norm(LABEL_RANK[home.energyLabel], allHomes.map((h) => LABEL_RANK[h.energyLabel])), raw: home.energyLabel },
    { metric: 'Lage VvE',     value: norm(home.vveMonthly, allHomes.map((h) => h.vveMonthly), true), raw: `€${home.vveMonthly}/mnd` },
    { metric: 'Parking',      value: home.ownParking ? 1 : 0,                                     raw: home.ownParking ? 'ja' : 'nee' },
    { metric: 'Waarde-marge', value: norm(derived.valueHeadroomEUR ?? 0, headroomVals),            raw: derived.valueHeadroomEUR != null ? `€${Math.round(derived.valueHeadroomEUR / 1000)}K` : '—' },
    { metric: 'Lage €/m²',    value: norm(derived.pricePerM2, allDerived.map((d) => d.pricePerM2), true), raw: `€${Math.round(derived.pricePerM2)}` },
    { metric: 'Nieuwbouw',    value: norm(home.bouwjaar, allHomes.map((h) => h.bouwjaar)),         raw: `${home.bouwjaar}` },
    { metric: 'Geen renov.',  value: norm(home.renovationEstimate ?? 0, allHomes.map((h) => h.renovationEstimate ?? 0), true), raw: home.renovationEstimate ? `€${Math.round(home.renovationEstimate/1000)}K nodig` : 'kant-en-klaar' }
  ];
}
