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

export type TagTone = 'good' | 'bad' | 'neutral';

export interface SignatureTag {
  label: string;
  detail: string;
  tone: TagTone;
}

/**
 * Compute standout positives AND negatives per home relative to the dataset.
 * Each dimension may award a 'good' tag to the leader and a 'bad' tag to the worst.
 */
export function signatureTags(
  homes: Home[],
  derived: DerivedMetrics[]
): Record<string, SignatureTag[]> {
  const result: Record<string, SignatureTag[]> = Object.fromEntries(
    homes.map((h) => [h.id, []])
  );

  // Push to a single winner index (returns -1 on tie -> no tag awarded)
  const argExtreme = (vals: number[], higherIsBetter: boolean): number => {
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

  // Award both leader (good) and laggard (bad) for a single dimension
  const award = (
    vals: number[],
    higherIsBetter: boolean,
    goodLabel: string,
    badLabel: string,
    formatter: (v: number) => string,
    opts: { skipBad?: boolean; skipGood?: boolean; minSpread?: number } = {}
  ) => {
    const finite = vals.filter((v) => Number.isFinite(v));
    if (finite.length < 2) return;
    const max = Math.max(...finite);
    const min = Math.min(...finite);
    if (opts.minSpread != null && max - min < opts.minSpread) return;
    if (max === min) return;
    const winnerIdx = argExtreme(vals, higherIsBetter);
    const loserIdx = argExtreme(vals, !higherIsBetter);
    if (!opts.skipGood && winnerIdx >= 0) {
      result[homes[winnerIdx].id].push({
        label: goodLabel,
        detail: formatter(vals[winnerIdx]),
        tone: 'good'
      });
    }
    if (!opts.skipBad && loserIdx >= 0) {
      result[homes[loserIdx].id].push({
        label: badLabel,
        detail: formatter(vals[loserIdx]),
        tone: 'bad'
      });
    }
  };

  // m² — biggest = good, smallest = bad
  award(
    homes.map((h) => h.m2),
    true,
    'Grootst',
    'Kleinst',
    (v) => `${v}m²`
  );

  // Bouwjaar — newest = good, oldest = bad
  award(
    homes.map((h) => h.bouwjaar),
    true,
    'Nieuwst',
    'Oudst',
    (v) => `${v}`
  );

  // Energy label — best rank = good, worst = bad
  award(
    homes.map((h) => LABEL_RANK[h.energyLabel]),
    true,
    'Beste label',
    'Slechtste label',
    (rank) => {
      const home = homes.find((h) => LABEL_RANK[h.energyLabel] === rank);
      return home?.energyLabel ?? `${rank}`;
    }
  );

  // VvE — lowest = good, highest = bad
  award(
    homes.map((h) => h.vveMonthly),
    false,
    'Laagste VvE',
    'Hoogste VvE',
    (v) => `€${v}/mnd`
  );

  // €/m² — cheapest = good, priciest = bad
  award(
    derived.map((d) => d.pricePerM2),
    false,
    'Goedkoopst per m²',
    'Duurst per m²',
    (v) => `€${Math.round(v)}`
  );

  // Absolute price — cheapest = good, priciest = bad
  award(
    homes.map((h) => h.askPrice),
    false,
    'Goedkoopst totaal',
    'Duurst totaal',
    (v) => `€${Math.round(v / 1000)}K`
  );

  // Market heat (views/day) — coldest = good, hottest = bad
  const vpdVals = derived.map((d) =>
    d.viewsPerDay != null ? d.viewsPerDay : NaN
  );
  if (vpdVals.every((v) => Number.isFinite(v))) {
    award(
      vpdVals,
      false,
      'Koudste markt',
      'Heetste markt',
      (v) => `${Math.round(v)}/d`
    );
  }

  // Value vs Huispedia p60 — biggest margin = good, most overpriced = bad
  const valueVals = derived.map((d) =>
    d.valueHeadroomEUR != null ? d.valueHeadroomEUR : NaN
  );
  award(
    valueVals,
    true,
    'Beste waarde-marge',
    'Boven modelwaarde',
    (v) =>
      v >= 0
        ? `+€${Math.round(v / 1000)}K vs p60`
        : `−€${Math.round(Math.abs(v) / 1000)}K vs p60`
  );

  // Storage — biggest = good (skip 'bad' to avoid noisy 1m² differences)
  award(
    homes.map((h) => h.storageM2 ?? 0),
    true,
    'Grootste berging',
    'Kleinste berging',
    (v) => `${v}m²`,
    { minSpread: 5 }
  );

  // WOZ growth '23→'25 — biggest = good, weakest = bad
  const wozGrowthVals = derived.map((d) =>
    d.wozGrowth23to25Pct != null ? d.wozGrowth23to25Pct : NaN
  );
  award(
    wozGrowthVals,
    true,
    'Sterkste WOZ-groei',
    'Zwakste WOZ-groei',
    (v) => `+${v.toFixed(1)}% '23→'25`
  );

  // Renovation — 0 = good (instapklaar), highest = bad
  const renovVals = homes.map((h) => h.renovationEstimate ?? 0);
  const renovMax = Math.max(...renovVals);
  if (renovMax > 0) {
    // Every home at 0 gets an 'Instapklaar' tag
    homes.forEach((h, i) => {
      if (renovVals[i] === 0) {
        result[h.id].push({
          label: 'Instapklaar',
          detail: 'geen renovatie nodig',
          tone: 'good'
        });
      }
    });
    // The worst gets the bad tag
    const worstIdx = renovVals.indexOf(renovMax);
    result[homes[worstIdx].id].push({
      label: 'Veel renovatie',
      detail: `~€${Math.round(renovMax / 1000)}K`,
      tone: 'bad'
    });
  }

  // Binary features — eigen parkeer / lift: only flag absence as bad if some have it
  const hasParking = homes.some((h) => h.ownParking);
  const lacksParking = homes.some((h) => !h.ownParking);
  if (hasParking && lacksParking) {
    homes.forEach((h) => {
      if (h.ownParking) {
        result[h.id].push({
          label: 'Eigen parkeer',
          detail: 'inpandig',
          tone: 'good'
        });
      } else {
        result[h.id].push({
          label: 'Geen parkeer',
          detail: 'openbaar',
          tone: 'bad'
        });
      }
    });
  }

  const hasLift = homes.some((h) => h.hasLift);
  const lacksLift = homes.some((h) => h.hasLift === false);
  if (hasLift && lacksLift) {
    homes.forEach((h) => {
      if (h.hasLift === false) {
        result[h.id].push({
          label: 'Geen lift',
          detail: 'trappenhuis',
          tone: 'bad'
        });
      }
    });
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
