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
    pick: (h) => h.woz['2025'],
    numeric: (h) => h.woz['2025'],
    higherBetter: true,
    fmt: fmtEURk
  },
  {
    label: 'WOZ groei \'23→\'25',
    pick: (_h, d) => d.wozGrowth23to25Pct,
    numeric: (_h, d) => d.wozGrowth23to25Pct,
    higherBetter: true,
    fmt: (v) => `+${v.toFixed(1)}%`
  },
  {
    label: 'Huispedia p60',
    pick: (h) => h.huispedia.p60,
    numeric: (h) => h.huispedia.p60,
    higherBetter: true,
    fmt: fmtEURk
  },
  {
    label: 'Waarde-marge (p60 − bod)',
    pick: (h, _d, ctx) => h.huispedia.p60 - (ctx.bids[h.id] ?? h.askPrice),
    numeric: (h, _d, ctx) => h.huispedia.p60 - (ctx.bids[h.id] ?? h.askPrice),
    higherBetter: true,
    fmt: (v) => (v >= 0 ? `+${fmtEURk(v)}` : `−€${Math.round(Math.abs(v) / 1000)}K`)
  },
  {
    label: 'Eigen geld nodig',
    pick: (h, _d, ctx) => {
      const bid = ctx.bids[h.id] ?? h.askPrice;
      return eigenGeldNeeded(bid, h.energyLabel, ctx.controls.kostenKoperPct).total;
    },
    numeric: (h, _d, ctx) => {
      const bid = ctx.bids[h.id] ?? h.askPrice;
      return eigenGeldNeeded(bid, h.energyLabel, ctx.controls.kostenKoperPct).total;
    },
    higherBetter: false,
    fmt: (v) => fmtEUR(v)
  },
  {
    label: 'Maandlast totaal',
    pick: (h, _d, ctx) => {
      const bid = ctx.bids[h.id] ?? h.askPrice;
      return totalMonthly(h, bid, ctx.controls.ratePct, ctx.controls.termYears).total;
    },
    numeric: (h, _d, ctx) => {
      const bid = ctx.bids[h.id] ?? h.askPrice;
      return totalMonthly(h, bid, ctx.controls.ratePct, ctx.controls.termYears).total;
    },
    higherBetter: false,
    fmt: (v) => `€${Math.round(v).toLocaleString('nl-NL')}`
  },
  {
    label: 'Dagen op Funda',
    pick: (h) => h.popularity.daysOnFunda ?? '?',
    numeric: (h) => h.popularity.daysOnFunda ?? 0,
    higherBetter: true,
    fmt: (v) => `${v} d`
  }
];

interface Props {
  homes: Home[];
  derived: DerivedMetrics[];
  bids: Record<string, number>;
  controls: GlobalControls;
}

export function ComparisonTable({ homes, derived, bids, controls }: Props) {
  const ctx: Ctx = { bids, controls };

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
              const best = row.higherBetter ? Math.max(...nums) : Math.min(...nums);
              const worst = row.higherBetter ? Math.min(...nums) : Math.max(...nums);
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
                    const isBest = v === best && best !== worst;
                    const isWorst = v === worst && best !== worst;
                    const bg = isBest
                      ? 'bg-good/15 text-good'
                      : isWorst
                      ? 'bg-bad/15 text-bad'
                      : 'text-text';
                    const display =
                      typeof raw === 'number' && row.fmt
                        ? row.fmt(v)
                        : typeof raw === 'string'
                        ? raw
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
