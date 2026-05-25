import { Home } from '../data/homes';
import { Card } from './ui/Card';
import { Slider } from './ui/Slider';
import { GlobalControls } from './ControlsPanel';
import {
  eigenGeldNeeded,
  fmtEUR,
  mortgageCap,
  totalMonthly
} from '../lib/finance';

interface Props {
  homes: Home[];
  bids: Record<string, number>;
  onBidChange: (id: string, v: number) => void;
  controls: GlobalControls;
}

const COLORS = ['#6ee7b7', '#fbbf24', '#60a5fa', '#f472b6', '#a78bfa'];

export function BidStrip({ homes, bids, onBidChange, controls }: Props) {
  const budget = controls.ownMoneyBudgetK * 1000;

  return (
    <Card
      title="Bod-sliders"
      subtitle="Sleep om eigen geld + maandlast direct te zien"
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {homes.map((h, i) => {
          const bid = bids[h.id] ?? h.askPrice;
          const pct = (bid / h.askPrice) * 100;
          const cap = mortgageCap(h.energyLabel);
          const eg = eigenGeldNeeded(bid, h.energyLabel, controls.kostenKoperPct);
          const monthly = totalMonthly(h, bid, controls.ratePct, controls.termYears);
          const headroom = budget - eg.total;
          const fits = headroom >= 0;
          const color = COLORS[i % COLORS.length];

          return (
            <div
              key={h.id}
              className="space-y-3 rounded-lg border border-border bg-panel2/60 p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-sm font-semibold text-text">
                    {h.address}
                  </div>
                  <div className="text-[11px] text-muted">
                    vraag {fmtEUR(h.askPrice)} · label {h.energyLabel} · cap {fmtEUR(cap)}
                  </div>
                </div>
                <div
                  className="rounded-md px-2 py-0.5 font-mono text-xs"
                  style={{
                    background: color + '22',
                    color: color
                  }}
                >
                  {pct.toFixed(1)}%
                </div>
              </div>

              <Slider
                label={<span className="text-[11px]">Bod</span>}
                value={bid}
                onChange={(v) => onBidChange(h.id, v)}
                min={Math.round(h.askPrice * 0.85)}
                max={Math.round(h.askPrice * 1.15)}
                step={500}
                formatValue={(v) => fmtEUR(v)}
                accent={color}
              />

              <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                <MiniStat
                  label="eigen geld"
                  value={`€${Math.round(eg.total / 1000)}K`}
                  color={
                    fits ? (headroom > 30_000 ? 'text-good' : 'text-warn') : 'text-bad'
                  }
                />
                <MiniStat
                  label="maandlast"
                  value={`€${Math.round(monthly.total).toLocaleString('nl-NL')}`}
                />
                <MiniStat
                  label={fits ? 'over' : 'tekort'}
                  value={`€${Math.round(Math.abs(headroom) / 1000)}K`}
                  color={fits ? 'text-good' : 'text-bad'}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function MiniStat({
  label,
  value,
  color = 'text-text'
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="rounded-md bg-bg/40 px-2 py-1.5">
      <div className="text-[10px] uppercase tracking-wide text-muted">
        {label}
      </div>
      <div className={`font-mono text-xs font-semibold ${color}`}>{value}</div>
    </div>
  );
}
