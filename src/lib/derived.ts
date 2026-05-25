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

export interface SignatureTag {
  label: string;
  detail: string;
}

/**
 * Compute the standout positive characteristics of each home relative to the dataset.
 * One home can win multiple dimensions; if a dimension has no clear winner we skip it.
 */
export function signatureTags(
  homes: Home[],
  derived: DerivedMetrics[]
): Record<string, SignatureTag[]> {
  const result: Record<string, SignatureTag[]> = Object.fromEntries(
    homes.map((h) => [h.id, []])
  );

  const pushIf = (
    winnerIdx: number,
    label: string,
    detail: string,
    tie = false
  ) => {
    if (winnerIdx < 0 || tie) return;
    result[homes[winnerIdx].id].push({ label, detail });
  };

  // Helper: index of max/min with tie detection (returns -1 on tie)
  const argBest = (vals: number[], higherIsBetter: boolean): number => {
    if (vals.length === 0) return -1;
    let best = vals[0];
    let bestIdx = 0;
    let ties = 0;
    for (let i = 1; i < vals.length; i++) {
      const better = higherIsBetter ? vals[i] > best : vals[i] < best;
      if (better) {
        best = vals[i];
        bestIdx = i;
        ties = 0;
      } else if (vals[i] === best) {
        ties++;
      }
    }
    return ties > 0 ? -1 : bestIdx;
  };

  // m² — biggest
  pushIf(
    argBest(homes.map((h) => h.m2), true),
    'Grootst',
    `${Math.max(...homes.map((h) => h.m2))}m²`
  );

  // Newest build year
  pushIf(
    argBest(homes.map((h) => h.bouwjaar), true),
    'Nieuwst',
    `${Math.max(...homes.map((h) => h.bouwjaar))}`
  );

  // Best energy label
  const labelRanks = homes.map((h) => LABEL_RANK[h.energyLabel]);
  const bestLabelIdx = argBest(labelRanks, true);
  if (bestLabelIdx >= 0) {
    pushIf(bestLabelIdx, 'Beste label', homes[bestLabelIdx].energyLabel);
  }

  // Lowest VvE
  pushIf(
    argBest(homes.map((h) => h.vveMonthly), false),
    'Laagste VvE',
    `€${Math.min(...homes.map((h) => h.vveMonthly))}/mnd`
  );

  // Cheapest €/m²
  pushIf(
    argBest(derived.map((d) => d.pricePerM2), false),
    'Goedkoopst per m²',
    `€${Math.round(Math.min(...derived.map((d) => d.pricePerM2)))}`
  );

  // Lowest absolute price
  pushIf(
    argBest(homes.map((h) => h.askPrice), false),
    'Goedkoopst totaal',
    `€${Math.round(Math.min(...homes.map((h) => h.askPrice)) / 1000)}K`
  );

  // Coolest market
  const vpdVals = derived.map((d) => d.viewsPerDay ?? Infinity);
  const coldestIdx = argBest(vpdVals, false);
  if (coldestIdx >= 0 && derived[coldestIdx].viewsPerDay != null) {
    pushIf(
      coldestIdx,
      'Koudste markt',
      `${Math.round(derived[coldestIdx].viewsPerDay as number)}/d`
    );
  }

  // Best value vs Huispedia p60
  const valueVals = derived.map((d) =>
    d.valueHeadroomEUR != null ? d.valueHeadroomEUR : -Infinity
  );
  const bestValueIdx = argBest(valueVals, true);
  if (bestValueIdx >= 0 && derived[bestValueIdx].valueHeadroomEUR != null) {
    pushIf(
      bestValueIdx,
      'Beste waarde-marge',
      `+€${Math.round((derived[bestValueIdx].valueHeadroomEUR as number) / 1000)}K vs p60`
    );
  }

  // Largest storage
  const storageVals = homes.map((h) => h.storageM2 ?? 0);
  if (Math.max(...storageVals) > Math.min(...storageVals)) {
    pushIf(
      argBest(storageVals, true),
      'Grootste berging',
      `${Math.max(...storageVals)}m²`
    );
  }

  // Lowest renovation needed (only if some homes have renovation needed)
  const renovVals = homes.map((h) => h.renovationEstimate ?? 0);
  if (Math.max(...renovVals) > 0) {
    const noRenovIdx = renovVals.findIndex((v) => v === 0);
    if (noRenovIdx >= 0) {
      result[homes[noRenovIdx].id].push({
        label: 'Kant-en-klaar',
        detail: 'geen renovatie nodig'
      });
    }
  }

  // Strongest WOZ growth
  const wozGrowthVals = derived.map((d) =>
    d.wozGrowth23to25Pct ?? -Infinity
  );
  const bestWozIdx = argBest(wozGrowthVals, true);
  if (bestWozIdx >= 0 && derived[bestWozIdx].wozGrowth23to25Pct != null) {
    pushIf(
      bestWozIdx,
      'Sterkste WOZ-groei',
      `+${(derived[bestWozIdx].wozGrowth23to25Pct as number).toFixed(1)}% (\'23→\'25)`
    );
  }

  return result;
}

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
