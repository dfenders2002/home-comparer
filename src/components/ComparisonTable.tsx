import { Home } from '../data/homes';
import { DerivedMetrics } from '../lib/derived';
import { eigenGeldNeeded, fmtEUR, fmtEURk, totalMonthly } from '../lib/finance';
import { Card } from './ui/Card';
import { GlobalControls } from './ControlsPanel';
import { LABEL_RANK } from '../data/constants';

interface RowDef {
  label: string;
  pick: (home: Home, d: DerivedMetrics, ctx: Ctx) => number | string;
  numeric: (home: Home, d: DerivedMetrics, ctx: Ctx) => number;
  /** higher is better? */
  higherBetter: boolean;
  fmt?: (v: number) => string;
}

interface Ctx {
  bids: Record<string, number>;
  taxaties: Record<string, number>;
  controls: GlobalControls;
}

const ROWS: RowDef[] = [
  {
    label: 'Vraagprijs',
    pick: (h) => h.askPrice,
    numeric: (h) => h.askPrice,
    higherBetter: false,
    fmt: fmtEURk
  },
  {
    label: 'Jouw bod',
    pick: (h, _d, ctx) => ctx.bids[h.id] ?? h.askPrice,
    numeric: (h, _d, ctx) => ctx.bids[h.id] ?? h.askPrice,
    higherBetter: false,
    fmt: fmtEURk
  },
  {
    label: 'Bod % van vraag',
    pick: (h, _d, ctx) => ((ctx.bids[h.id] ?? h.askPrice) / h.askPrice) * 100,
    numeric: (h, _d, ctx) => ((ctx.bids[h.id] ?? h.askPrice) / h.askPrice) * 100,
    higherBetter: false,
    fmt: (v) => `${v.toFixed(1)}%`
  },
  {
    label: 'm²',
    pick: (h) => h.m2,
    numeric: (h) => h.m2,
    higherBetter: true,
    fmt: (v) => `${v} m²`
  },
  {
    label: 'Prijs per m²',
    pick: (_h, d) => d.pricePerM2,
    numeric: (_h, d) => d.pricePerM2,
    higherBetter: false,
    fmt: (v) => `€${Math.round(v).toLocaleString('nl-NL')}`
  },
  {
    label: 'Bouwjaar',
    pick: (h) => h.bouwjaar,
    numeric: (h) => h.bouwjaar,
    higherBetter: true,
    fmt: (v) => `${v}`
  },
  {
    label: 'Energielabel',
    pick: (h) => h.energyLabel,
    numeric: (h) => LABEL_RANK[h.energyLabel],
    higherBetter: true
  },
  {
    label: 'VvE / mnd',
    pick: (h) => h.vveMonthly,
    numeric: (h) => h.vveMonthly,
    higherBetter: false,
    fmt: (v) => `€${v}`
  },
  {
    label: 'Eigen parkeer',
    pick: (h) => (h.ownParking ? 'Ja' : 'Nee'),
    numeric: (h) => (h.ownParking ? 1 : 0),
    higherBetter: true
  },
  {
    label: 'WOZ 2025',
    pick: (h) => h.woz?.['2025'] ?? '—',
    numeric: (h) => h.woz?.['2025'] ?? Number.NEGATIVE_INFINITY,
    higherBetter: true,
    fmt: (v) => (Number.isFinite(v) ? fmtEURk(v) : '—')
  },
  {
    label: 'WOZ groei \'23→\'25',
    pick: (_h, d) => (d.wozGrowth23to25Pct ?? null) === null ? '—' : (d.wozGrowth23to25Pct as number),
    numeric: (_h, d) => d.wozGrowth23to25Pct ?? Number.NEGATIVE_INFINITY,
    higherBetter: true,
    fmt: (v) => (Number.isFinite(v) ? `+${v.toFixed(1)}%` : '—')
  },
  {
    label: 'Huispedia p60',
    pick: (h) => h.huispedia?.p60 ?? '—',
    numeric: (h) => h.huispedia?.p60 ?? Number.NEGATIVE_INFINITY,
    higherBetter: true,
    fmt: (v) => (Number.isFinite(v) ? fmtEURk(v) : '—')
  },
  {
    label: 'Waarde-marge (p60 − bod)',
    pick: (h, _d, ctx) =>
      h.huispedia ? h.huispedia.p60 - (ctx.bids[h.id] ?? h.askPrice) : '—',
    numeric: (h, _d, ctx) =>
      h.huispedia
        ? h.huispedia.p60 - (ctx.bids[h.id] ?? h.askPrice)
        : Number.NEGATIVE_INFINITY,
    higherBetter: true,
    fmt: (v) =>
      !Number.isFinite(v)
        ? '—'
        : v >= 0
        ? `+${fmtEURk(v)}`
        : `−€${Math.round(Math.abs(v) / 1000)}K`
  },
  {
    label: 'Eigen geld nodig',
    pick: (h, _d, ctx) => {
      const bid = ctx.bids[h.id] ?? h.askPrice;
      return eigenGeldNeeded(bid, h.energyLabel, ctx.controls.kostenKoperPct, ctx.taxaties[h.id] ?? 0).total;
    },
    numeric: (h, _d, ctx) => {
      const bid = ctx.bids[h.id] ?? h.askPrice;
      return eigenGeldNeeded(bid, h.energyLabel, ctx.controls.kostenKoperPct, ctx.taxaties[h.id] ?? 0).total;
    },
    higherBetter: false,
    fmt: (v) => fmtEUR(v)
  },
  {
    label: 'Maandlast totaal',
    pick: (h, _d, ctx) => {
      const bid = ctx.bids[h.id] ?? h.askPrice;
      return totalMonthly(h, bid, ctx.controls.ratePct, ctx.controls.termYears, ctx.taxaties[h.id] ?? 0).total;
    },
    numeric: (h, _d, ctx) => {
      const bid = ctx.bids[h.id] ?? h.askPrice;
      return totalMonthly(h, bid, ctx.controls.ratePct, ctx.controls.termYears, ctx.taxaties[h.id] ?? 0).total;
    },
    higherBetter: false,
    fmt: (v) => `€${Math.round(v).toLocaleString('nl-NL')}`
  },
  {
    label: 'Renovatie nodig',
    pick: (h) => h.renovationEstimate ?? 0,
    numeric: (h) => h.renovationEstimate ?? 0,
    higherBetter: false,
    fmt: (v) => (v > 0 ? `€${Math.round(v / 1000)}K` : '—')
  },
  {
    label: 'Cash totaal (eg + renov)',
    pick: (h, _d, ctx) => {
      const bid = ctx.bids[h.id] ?? h.askPrice;
      const eg = eigenGeldNeeded(bid, h.energyLabel, ctx.controls.kostenKoperPct, ctx.taxaties[h.id] ?? 0).total;
      return eg + (h.renovationEstimate ?? 0);
    },
    numeric: (h, _d, ctx) => {
      const bid = ctx.bids[h.id] ?? h.askPrice;
      const eg = eigenGeldNeeded(bid, h.energyLabel, ctx.controls.kostenKoperPct, ctx.taxaties[h.id] ?? 0).total;
      return eg + (h.renovationEstimate ?? 0);
    },
    higherBetter: false,
    fmt: (v) => fmtEUR(v)
  },
  {
    label: 'Dagen op Funda',
    pick: (h) => h.popularity.daysOnFunda ?? '?',
    numeric: (h) => h.popularity.daysOnFunda ?? 0,
    higherBetter: true,
    fmt: (v) => `${v} d`
  },
  {
    label: 'Views / dag (markt-heat)',
    pick: (_h, d) => (d.viewsPerDay != null ? Math.round(d.viewsPerDay) : '—'),
    numeric: (_h, d) => d.viewsPerDay ?? 0,
    higherBetter: false,                // lower = cooler = better for buyer
    fmt: (v) => `${Math.round(v)}/d`
  }
];

interface Props {
  homes: Home[];
  derived: DerivedMetrics[];
  bids: Record<string, number>;
  taxaties: Record<string, number>;
  controls: GlobalControls;
}

export function ComparisonTable({ homes, derived, bids, taxaties, controls }: Props) {
  const ctx: Ctx = { bids, taxaties, controls };

  return (
    <Card
      title="Vergelijking per metriek"
      subtitle="Groen = beste, rood = slechtste per rij"
    >
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-panel px-3 py-2 text-left font-medium text-muted">
                Metriek
              </th>
              {homes.map((h) => (
                <th
                  key={h.id}
                  className="px-3 py-2 text-left font-semibold text-text"
                >
                  {h.address}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row, ri) => {
              const nums = homes.map((h, i) => row.numeric(h, derived[i], ctx));
              const finiteNums = nums.filter((n) => Number.isFinite(n));
              const best =
                finiteNums.length > 0
                  ? row.higherBetter
                    ? Math.max(...finiteNums)
                    : Math.min(...finiteNums)
                  : NaN;
              const worst =
                finiteNums.length > 0
                  ? row.higherBetter
                    ? Math.min(...finiteNums)
                    : Math.max(...finiteNums)
                  : NaN;
              return (
                <tr
                  key={ri}
                  className="border-t border-border/60 hover:bg-panel2/40"
                >
                  <td className="sticky left-0 z-10 bg-panel px-3 py-2 text-muted">
                    {row.label}
                  </td>
                  {homes.map((h, ci) => {
                    const v = nums[ci];
                    const raw = row.pick(h, derived[ci], ctx);
                    const isFinite = Number.isFinite(v);
                    const isBest = isFinite && v === best && best !== worst;
                    const isWorst = isFinite && v === worst && best !== worst;
                    const bg = isBest
                      ? 'bg-good/15 text-good'
                      : isWorst
                      ? 'bg-bad/15 text-bad'
                      : 'text-text';
                    const display =
                      typeof raw === 'string'
                        ? raw
                        : typeof raw === 'number' && row.fmt
                        ? row.fmt(v)
                        : v.toString();
                    return (
                      <td
                        key={ci}
                        className={`px-3 py-2 font-mono text-[13px] ${bg}`}
                      >
                        {display}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
