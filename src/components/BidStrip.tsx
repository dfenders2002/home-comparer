import { Home } from '../data/homes';
import { Card } from './ui/Card';
import { Slider, SliderMarker } from './ui/Slider';
import { GlobalControls } from './ControlsPanel';
import {
  eigenGeldNeeded,
  fmtEUR,
  mortgageCap,
  totalMonthly
} from '../lib/finance';
import { DerivedMetrics, HEAT_COLOR, HEAT_LABEL } from '../lib/derived';

interface Props {
  homes: Home[];
  derived: DerivedMetrics[];
  bids: Record<string, number>;
  onBidChange: (id: string, v: number) => void;
  controls: GlobalControls;
}

const COLORS = ['#6ee7b7', '#fbbf24', '#60a5fa', '#f472b6', '#a78bfa'];

export function BidStrip({ homes, derived, bids, onBidChange, controls }: Props) {
  const budget = controls.ownMoneyBudgetK * 1000;

  return (
    <Card
      title="Bod-sliders"
      subtitle="Tickjes onder de slider = Huispedia 40/60/80% waarderingen"
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {homes.map((h, i) => {
          const bid = bids[h.id] ?? h.askPrice;
          const pct = (bid / h.askPrice) * 100;
          const cap = mortgageCap(h.energyLabel);
          const eg = eigenGeldNeeded(bid, h.energyLabel, controls.kostenKoperPct);
          const monthly = totalMonthly(h, bid, controls.ratePct, controls.termYears);
          const renov = h.renovationEstimate ?? 0;
          const cashOut = eg.total + renov;
          const headroom = budget - cashOut;
          const fits = headroom >= 0;
          const color = COLORS[i % COLORS.length];
          const d = derived[i];

          const markers: SliderMarker[] = [];
          if (h.huispedia) {
            markers.push(
              { value: h.huispedia.p40, label: 'p40', color: '#6ee7b7' },
              { value: h.huispedia.p60, label: 'p60', color: '#6ee7b7' },
              { value: h.huispedia.p80, label: 'p80', color: '#6ee7b7' }
            );
          }
          markers.push({ value: h.askPrice, label: 'vraag', color: '#fbbf24' });

          return (
            <div
              key={h.id}
              className="space-y-3 rounded-lg border border-border bg-panel2/60 p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-text">
                    {h.address}
                  </div>
                  <div className="truncate text-[11px] text-muted">
                    vraag {fmtEUR(h.askPrice)} · {h.energyLabel} · cap{' '}
                    {fmtEUR(cap)}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div
                    className="rounded-md px-2 py-0.5 font-mono text-xs"
                    style={{
                      background: color + '22',
                      color: color
                    }}
                  >
                    {pct.toFixed(1)}%
                  </div>
                  <div
                    className="rounded-md px-1.5 py-0.5 text-[10px] font-medium"
                    style={{
                      background: HEAT_COLOR[d.heat] + '22',
                      color: HEAT_COLOR[d.heat]
                    }}
                  >
                    {HEAT_LABEL[d.heat]}
                  </div>
                </div>
              </div>

              <Slider
                label={<span className="text-[11px]">Bod</span>}
                value={bid}
                onChange={(v) => onBidChange(h.id, v)}
                min={Math.round(
                  Math.min(h.askPrice, h.huispedia?.p40 ?? h.askPrice) * 0.9
                )}
                max={Math.round(
                  Math.max(h.askPrice, h.huispedia?.p80 ?? h.askPrice) * 1.05
                )}
                step={500}
                formatValue={(v) => fmtEUR(v)}
                accent={color}
                markers={markers}
                hint={
                  <span>
                    Aanbevolen ({HEAT_LABEL[d.heat].toLowerCase()}):{' '}
                    <span className="font-mono">
                      {d.suggestedBidPctRange[0]}–{d.suggestedBidPctRange[1]}%
                    </span>{' '}
                    van vraag
                  </span>
                }
              />

              <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                <MiniStat
                  label="eigen geld"
                  value={`€${Math.round(eg.total / 1000)}K`}
                  sub={
                    renov > 0
                      ? `+ €${Math.round(renov / 1000)}K renov`
                      : 'geen renov'
                  }
                />
                <MiniStat
                  label="maandlast"
                  value={`€${Math.round(monthly.total).toLocaleString('nl-NL')}`}
                  sub={`hyp €${Math.round(monthly.mortgage)}`}
                />
                <MiniStat
                  label="cash totaal"
                  value={`€${Math.round(cashOut / 1000)}K`}
                  sub="eg + renov"
                />
                <MiniStat
                  label={fits ? 'over' : 'tekort'}
                  value={`€${Math.round(Math.abs(headroom) / 1000)}K`}
                  color={fits ? 'text-good' : 'text-bad'}
                  sub={`v.s. €${controls.ownMoneyBudgetK}K`}
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
  sub,
  color = 'text-text'
}: {
  label: string;
  value: string;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="rounded-md bg-bg/40 px-2 py-1.5">
      <div className="text-[10px] uppercase tracking-wide text-muted">
        {label}
      </div>
      <div className={`font-mono text-xs font-semibold ${color}`}>{value}</div>
      {sub && <div className="text-[10px] text-muted">{sub}</div>}
    </div>
  );
}
