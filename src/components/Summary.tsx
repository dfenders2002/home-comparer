import { Home } from '../data/homes';
import { Card } from './ui/Card';
import { Slider, SliderMarker } from './ui/Slider';
import { GlobalControls } from './ControlsPanel';
import {
  eigenGeldNeeded,
  fmtEUR,
  fmtEURk,
  mortgageCap,
  totalMonthly
} from '../lib/finance';
import { DerivedMetrics, HEAT_COLOR, HEAT_LABEL } from '../lib/derived';
import { LABEL_RANK } from '../data/constants';
import {
  Crown,
  Snowflake,
  Ruler,
  TrendingUp,
  Wallet,
  ExternalLink
} from 'lucide-react';

interface Props {
  homes: Home[];
  derived: DerivedMetrics[];
  bids: Record<string, number>;
  onBidChange: (id: string, v: number) => void;
  controls: GlobalControls;
}

const COLORS = ['#6ee7b7', '#fbbf24', '#60a5fa', '#f472b6'];

export function Summary({ homes, derived, bids, onBidChange, controls }: Props) {
  const budget = controls.ownMoneyBudgetK * 1000;

  // Compute per-home dossier
  const rows = homes.map((h, i) => {
    const bid = bids[h.id] ?? h.askPrice;
    const eg = eigenGeldNeeded(
      bid,
      h.energyLabel,
      controls.kostenKoperPct,
      controls.taxatieShortfallPct
    );
    const renov = h.renovationEstimate ?? 0;
    const cashOut = eg.total + renov;
    const headroom = budget - cashOut;
    const monthly = totalMonthly(
      h,
      bid,
      controls.ratePct,
      controls.termYears,
      controls.taxatieShortfallPct
    );
    const valueVsP60 = h.huispedia ? h.huispedia.p60 - bid : null;
    return { home: h, i, derived: derived[i], bid, eg, renov, cashOut, headroom, monthly, valueVsP60 };
  });

  // Winners per dimension
  const fitsRows = rows.filter((r) => r.headroom >= 0);
  const cheapestPerM2 = [...rows].sort(
    (a, b) => a.derived.pricePerM2 - b.derived.pricePerM2
  )[0];
  const biggestRoom = [...rows].sort((a, b) => b.home.m2 - a.home.m2)[0];
  const coldestMarket = [...rows].sort(
    (a, b) => (a.derived.viewsPerDay ?? 0) - (b.derived.viewsPerDay ?? 0)
  )[0];
  const bestValue = [...rows]
    .filter((r) => r.valueVsP60 != null)
    .sort((a, b) => (b.valueVsP60 ?? 0) - (a.valueVsP60 ?? 0))[0];
  const lowestEigenGeld = [...rows].sort((a, b) => a.cashOut - b.cashOut)[0];

  // "Best pick now" — fits in budget, best combined score
  const scored = rows
    .filter((r) => r.headroom >= 0)
    .map((r) => {
      const m2Score = r.home.m2 / Math.max(...rows.map((x) => x.home.m2));
      const headroomScore =
        r.headroom / Math.max(...rows.map((x) => x.headroom));
      const valueScore =
        r.valueVsP60 != null
          ? (r.valueVsP60 + 100_000) /
            Math.max(...rows.map((x) => (x.valueVsP60 ?? -100_000) + 100_000))
          : 0.5;
      const heatScore =
        r.derived.heat === 'cold' ? 1 : r.derived.heat === 'medium' ? 0.7 : 0.4;
      const labelScore =
        LABEL_RANK[r.home.energyLabel] /
        Math.max(...rows.map((x) => LABEL_RANK[x.home.energyLabel]));
      const total =
        m2Score * 0.2 +
        headroomScore * 0.25 +
        valueScore * 0.25 +
        heatScore * 0.15 +
        labelScore * 0.15;
      return { ...r, total };
    })
    .sort((a, b) => b.total - a.total);

  const bestPick = scored[0];

  return (
    <div className="space-y-4">
      {/* Best-pick callout */}
      {bestPick && (
        <Card className="border-accent/40 bg-gradient-to-br from-accent/10 to-transparent">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-accent text-bg">
                <Crown size={20} />
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wide text-accent">
                  Beste keuze bij huidige bod & budget
                </div>
                <div className="text-lg font-semibold text-text">
                  {bestPick.home.address}
                </div>
                <div className="text-xs text-muted">
                  Score gebaseerd op headroom, waarde-marge, m², label en markt-heat.{' '}
                  {fitsRows.length}/{rows.length} appartementen passen in budget.
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-right">
              <KPI label="bod" value={fmtEURk(bestPick.bid)} />
              <KPI label="cash" value={fmtEURk(bestPick.cashOut)} />
              <KPI
                label="over budget"
                value={fmtEURk(bestPick.headroom)}
                color="text-good"
              />
            </div>
          </div>
        </Card>
      )}

      {/* Hero cards per home — 2x2 grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {rows.map((r) => (
          <HeroCard
            key={r.home.id}
            row={r}
            color={COLORS[r.i % COLORS.length]}
            onBidChange={(v) => onBidChange(r.home.id, v)}
            budgetK={controls.ownMoneyBudgetK}
            isBestPick={bestPick?.home.id === r.home.id}
          />
        ))}
      </div>

      {/* Winners strip */}
      <Card title="Winnaar per dimensie" subtitle="Wie wint waarop?">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
          <Winner
            icon={<Wallet size={14} />}
            label="Laagste cash-out"
            home={lowestEigenGeld.home.address}
            value={fmtEURk(lowestEigenGeld.cashOut)}
          />
          <Winner
            icon={<Ruler size={14} />}
            label="Goedkoopst per m²"
            home={cheapestPerM2.home.address}
            value={`€${Math.round(cheapestPerM2.derived.pricePerM2)}`}
          />
          <Winner
            icon={<Ruler size={14} />}
            label="Grootst"
            home={biggestRoom.home.address}
            value={`${biggestRoom.home.m2}m²`}
          />
          <Winner
            icon={<Snowflake size={14} />}
            label="Koudste markt"
            home={coldestMarket.home.address}
            value={
              coldestMarket.derived.viewsPerDay
                ? `${Math.round(coldestMarket.derived.viewsPerDay)}/d`
                : '—'
            }
          />
          {bestValue && (
            <Winner
              icon={<TrendingUp size={14} />}
              label="Beste waarde-marge"
              home={bestValue.home.address}
              value={
                bestValue.valueVsP60 != null
                  ? `+${fmtEURk(bestValue.valueVsP60)}`
                  : '—'
              }
            />
          )}
        </div>
      </Card>
    </div>
  );
}

interface HeroRow {
  home: Home;
  i: number;
  derived: DerivedMetrics;
  bid: number;
  eg: ReturnType<typeof eigenGeldNeeded>;
  renov: number;
  cashOut: number;
  headroom: number;
  monthly: ReturnType<typeof totalMonthly>;
  valueVsP60: number | null;
}

function HeroCard({
  row,
  color,
  onBidChange,
  budgetK,
  isBestPick
}: {
  row: HeroRow;
  color: string;
  onBidChange: (v: number) => void;
  budgetK: number;
  isBestPick: boolean;
}) {
  const { home, derived, bid, eg, renov, cashOut, headroom, monthly, valueVsP60 } = row;
  const pct = (bid / home.askPrice) * 100;
  const fits = headroom >= 0;
  const cap = mortgageCap(home.energyLabel);

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
    <div
      className={`rounded-xl border bg-panel p-4 ${
        isBestPick ? 'border-accent/50 ring-1 ring-accent/30' : 'border-border'
      }`}
    >
      {/* Header */}
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="truncate text-base font-semibold text-text">
              {home.address}
            </span>
            <a
              href={home.fundaUrl}
              target="_blank"
              rel="noreferrer"
              className="text-muted hover:text-accent"
            >
              <ExternalLink size={12} />
            </a>
            {isBestPick && (
              <span className="rounded-md bg-accent/20 px-1.5 py-0.5 text-[10px] font-medium text-accent">
                BESTE KEUZE
              </span>
            )}
          </div>
          <div className="text-[11px] text-muted">
            {home.m2}m² · {home.bouwjaar} · label{' '}
            <span className="text-text">{home.energyLabel}</span> · VvE €
            {home.vveMonthly}
            {home.ownParking ? ' · eigen parkeer' : ''}
            {renov > 0 ? ` · renov €${Math.round(renov / 1000)}K` : ''}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="text-xs text-muted">vraag</div>
          <div className="font-mono text-sm font-semibold text-text">
            {fmtEUR(home.askPrice)}
          </div>
          <div
            className="rounded-md px-1.5 py-0.5 text-[10px] font-medium"
            style={{
              background: HEAT_COLOR[derived.heat] + '22',
              color: HEAT_COLOR[derived.heat]
            }}
          >
            {HEAT_LABEL[derived.heat]}
            {derived.viewsPerDay != null
              ? ` · ${Math.round(derived.viewsPerDay)}/d`
              : ''}
          </div>
        </div>
      </div>

      {/* Bid slider */}
      <div className="mb-4">
        <Slider
          label={
            <span>
              Bod ·{' '}
              <span className="font-mono text-text">{pct.toFixed(1)}%</span>
              {' '}van vraag · aanbevolen{' '}
              <span className="font-mono">
                {derived.suggestedBidPctRange[0]}–{derived.suggestedBidPctRange[1]}%
              </span>
            </span>
          }
          value={bid}
          onChange={onBidChange}
          min={Math.round(
            Math.min(home.askPrice, home.huispedia?.p40 ?? home.askPrice) * 0.9
          )}
          max={Math.round(
            Math.max(home.askPrice, home.huispedia?.p80 ?? home.askPrice) * 1.05
          )}
          step={500}
          formatValue={(v) => fmtEUR(v)}
          accent={color}
          markers={markers}
        />
      </div>

      {/* 5 KPI tiles */}
      <div className="grid grid-cols-5 gap-1.5">
        <Tile
          label="Cash totaal"
          value={fmtEURk(cashOut)}
          sub={renov ? `+ €${Math.round(renov / 1000)}K renov` : 'enkel eg+kk'}
          tone="warn"
        />
        <Tile
          label={fits ? 'Over budget' : 'Tekort'}
          value={fmtEURk(Math.abs(headroom))}
          sub={`van €${budgetK}K`}
          tone={fits ? 'good' : 'bad'}
        />
        <Tile
          label="Maandlast"
          value={`€${Math.round(monthly.total).toLocaleString('nl-NL')}`}
          sub={`hyp €${Math.round(monthly.mortgage)}`}
        />
        <Tile
          label="Hypotheek"
          value={fmtEURk(eg.mortgage)}
          sub={
            eg.capGap > 0
              ? `cap-bind €${Math.round(eg.capGap / 1000)}K`
              : eg.taxatieGap > 0
              ? `tax-bind €${Math.round(eg.taxatieGap / 1000)}K`
              : `cap ${fmtEURk(cap)}`
          }
          tone={eg.capGap > 0 || eg.taxatieGap > 0 ? 'warn' : 'default'}
        />
        {valueVsP60 != null ? (
          <Tile
            label="Bod v.s. p60"
            value={
              valueVsP60 >= 0
                ? `+${fmtEURk(valueVsP60)}`
                : `−${fmtEURk(Math.abs(valueVsP60))}`
            }
            sub={valueVsP60 >= 0 ? 'onder model' : 'boven model'}
            tone={valueVsP60 >= 0 ? 'good' : 'bad'}
          />
        ) : (
          <Tile label="Bod v.s. p60" value="—" sub="geen huispedia" />
        )}
      </div>
    </div>
  );
}

function Tile({
  label,
  value,
  sub,
  tone = 'default'
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: 'default' | 'good' | 'bad' | 'warn';
}) {
  const valueClass =
    tone === 'good'
      ? 'text-good'
      : tone === 'bad'
      ? 'text-bad'
      : tone === 'warn'
      ? 'text-warn'
      : 'text-text';
  return (
    <div className="rounded-md border border-border bg-panel2/60 px-2 py-1.5">
      <div className="text-[10px] uppercase tracking-wide text-muted">
        {label}
      </div>
      <div className={`font-mono text-sm font-semibold ${valueClass}`}>
        {value}
      </div>
      {sub && <div className="truncate text-[10px] text-muted">{sub}</div>}
    </div>
  );
}

function KPI({
  label,
  value,
  color = 'text-text'
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-muted">
        {label}
      </div>
      <div className={`font-mono text-base font-semibold ${color}`}>{value}</div>
    </div>
  );
}

function Winner({
  icon,
  label,
  home,
  value
}: {
  icon: React.ReactNode;
  label: string;
  home: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-panel2/60 p-3">
      <div className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted">
        {icon} {label}
      </div>
      <div className="truncate text-xs font-semibold text-text">{home}</div>
      <div className="font-mono text-sm text-accent">{value}</div>
    </div>
  );
}
