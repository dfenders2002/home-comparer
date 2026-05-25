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
import { ExternalLink, Flame } from 'lucide-react';

interface Props {
  home: Home;
  derived: DerivedMetrics;
  bid: number;
  onBidChange: (v: number) => void;
  controls: GlobalControls;
}

export function BidSimulator({ home, derived, bid, onBidChange, controls }: Props) {
  const pct = (bid / home.askPrice) * 100;
  const cap = mortgageCap(home.energyLabel);
  const eg = eigenGeldNeeded(bid, home.energyLabel, controls.kostenKoperPct);
  const monthly = totalMonthly(home, bid, controls.ratePct, controls.termYears);
  const renov = home.renovationEstimate ?? 0;
  const cashOut = eg.total + renov;
  const budget = controls.ownMoneyBudgetK * 1000;
  const headroom = budget - cashOut;
  const fits = headroom >= 0;
  const headroomColor = fits
    ? headroom > 30_000
      ? 'text-good'
      : 'text-warn'
    : 'text-bad';

  const valueVsP60 =
    home.huispedia ? home.huispedia.p60 - bid : null;

  const markers: SliderMarker[] = [];
  if (home.huispedia) {
    markers.push(
      { value: home.huispedia.p40, label: 'p40', color: '#6ee7b7' },
      { value: home.huispedia.p60, label: 'p60', color: '#6ee7b7' },
      { value: home.huispedia.p80, label: 'p80', color: '#6ee7b7' }
    );
  }
  markers.push({ value: home.askPrice, label: 'vraag', color: '#fbbf24' });

  return (
    <Card
      title={
        <div className="flex items-center gap-2">
          <span>{home.address}</span>
          <a
            href={home.fundaUrl}
            target="_blank"
            rel="noreferrer"
            className="text-muted hover:text-accent"
          >
            <ExternalLink size={13} />
          </a>
          <span
            className="ml-2 flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium"
            style={{
              background: HEAT_COLOR[derived.heat] + '22',
              color: HEAT_COLOR[derived.heat]
            }}
          >
            <Flame size={10} /> {HEAT_LABEL[derived.heat]}
          </span>
        </div>
      }
      subtitle={
        <span>
          {home.m2}m² · {home.bouwjaar} · label {home.energyLabel} · VvE €
          {home.vveMonthly}/mnd
          {home.ownParking ? ' · eigen parkeer' : ''}
          {renov ? ` · renovatie €${Math.round(renov / 1000)}K` : ''}
        </span>
      }
      right={
        <div className="text-right">
          <div className="text-xs text-muted">Vraagprijs</div>
          <div className="font-mono text-sm text-text">{fmtEUR(home.askPrice)}</div>
        </div>
      }
    >
      <div className="space-y-5">
        <Slider
          label={
            <span>
              Jouw bod ·{' '}
              <span className="font-mono text-text">{pct.toFixed(1)}%</span> van
              vraag
            </span>
          }
          value={bid}
          onChange={onBidChange}
          min={Math.round(
            Math.min(home.askPrice, home.huispedia?.p40 ?? home.askPrice) * 0.88
          )}
          max={Math.round(
            Math.max(home.askPrice, home.huispedia?.p80 ?? home.askPrice) * 1.08
          )}
          step={500}
          formatValue={(v) => fmtEUR(v)}
          markers={markers}
          hint={
            <span>
              Max hypotheek bij label {home.energyLabel}: {fmtEUR(cap)} · Aanbevolen ({HEAT_LABEL[derived.heat].toLowerCase()}):{' '}
              {derived.suggestedBidPctRange[0]}–{derived.suggestedBidPctRange[1]}% van vraag
            </span>
          }
        />

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat
            label="Hypotheek"
            value={fmtEUR(Math.min(bid, cap))}
            sub={bid > cap ? `gap: ${fmtEUR(bid - cap)}` : 'past in cap'}
            subColor={bid > cap ? 'text-warn' : 'text-good'}
          />
          <Stat
            label="Eigen geld nodig"
            value={fmtEUR(eg.total)}
            sub={`gap €${Math.round(eg.gap / 1000)}K + KK €${Math.round(
              eg.kk / 1000
            )}K`}
          />
          <Stat
            label="Maandlast"
            value={`€${Math.round(monthly.total).toLocaleString('nl-NL')}`}
            sub={`hyp €${Math.round(monthly.mortgage)} + VvE €${monthly.vve}`}
          />
          <Stat
            label="Cash totaal"
            value={fmtEUR(cashOut)}
            sub={renov ? `eg + €${Math.round(renov / 1000)}K renov` : 'enkel eg'}
          />
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          <Stat
            label="Budget headroom"
            value={`${fits ? '' : '−'}${fmtEUR(Math.abs(headroom))}`}
            sub={fits ? `van €${controls.ownMoneyBudgetK}K budget` : 'BOVEN budget'}
            valueColor={headroomColor}
            subColor={headroomColor}
          />
          {valueVsP60 != null ? (
            <Stat
              label="Bod vs Huispedia p60"
              value={
                valueVsP60 >= 0
                  ? `+${fmtEUR(valueVsP60)}`
                  : `−${fmtEUR(Math.abs(valueVsP60))}`
              }
              valueColor={valueVsP60 >= 0 ? 'text-good' : 'text-bad'}
              sub={valueVsP60 >= 0 ? 'onder modelwaarde' : 'boven modelwaarde'}
            />
          ) : (
            <Stat
              label="Bod vs Huispedia p60"
              value="—"
              sub="huispedia ontbreekt"
            />
          )}
          <Stat
            label="Prijs / m²"
            value={`€${Math.round(bid / home.m2).toLocaleString('nl-NL')}`}
            sub="bij dit bod"
          />
        </div>
      </div>
    </Card>
  );
}

function Stat({
  label,
  value,
  sub,
  valueColor = 'text-text',
  subColor = 'text-muted'
}: {
  label: string;
  value: string;
  sub?: string;
  valueColor?: string;
  subColor?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-panel2/60 px-3 py-2.5">
      <div className="text-[11px] uppercase tracking-wide text-muted">
        {label}
      </div>
      <div className={`mt-0.5 font-mono text-base font-semibold ${valueColor}`}>
        {value}
      </div>
      {sub && <div className={`mt-0.5 text-[11px] ${subColor}`}>{sub}</div>}
    </div>
  );
}
