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
import {
  DerivedMetrics,
  HEAT_LABEL,
  signatureTags,
  SignatureTag
} from '../lib/derived';
import { LABEL_RANK } from '../data/constants';
import {
  Crown,
  Ruler,
  Calendar,
  Zap,
  Wallet,
  Car,
  ArrowUpDown,
  Box,
  Trees,
  Building2,
  BedDouble
} from 'lucide-react';
import { useMemo } from 'react';

interface Props {
  homes: Home[];
  derived: DerivedMetrics[];
  bids: Record<string, number>;
  onBidChange: (id: string, v: number) => void;
  taxaties: Record<string, number>;
  onTaxatieChange: (id: string, v: number) => void;
  controls: GlobalControls;
}

export function Summary({
  homes,
  derived,
  bids,
  onBidChange,
  taxaties,
  onTaxatieChange,
  controls
}: Props) {
  const budget = controls.ownMoneyBudgetK * 1000;
  const signatures = useMemo(
    () => signatureTags(homes, derived),
    [homes, derived]
  );

  const rows = homes.map((h, i) => {
    const bid = bids[h.id] ?? h.askPrice;
    const taxShortfall = taxaties[h.id] ?? 0;
    const taxatieValue = bid * (1 - taxShortfall / 100);
    const eg = eigenGeldNeeded(
      bid,
      h.energyLabel,
      controls.kostenKoperPct,
      taxShortfall
    );
    const renov = h.renovationEstimate ?? 0;
    const cashOut = eg.total + renov;
    const headroom = budget - cashOut;
    const monthly = totalMonthly(
      h,
      bid,
      controls.ratePct,
      controls.termYears,
      taxShortfall
    );
    const valueVsP60 = h.huispedia ? h.huispedia.p60 - bid : null;
    return {
      home: h,
      i,
      derived: derived[i],
      bid,
      taxShortfall,
      taxatieValue,
      eg,
      renov,
      cashOut,
      headroom,
      monthly,
      valueVsP60
    };
  });

  // Best pick — must fit in budget, weighted score
  const scored = rows
    .filter((r) => r.headroom >= 0)
    .map((r) => {
      const maxM2 = Math.max(...rows.map((x) => x.home.m2));
      const maxHead = Math.max(...rows.map((x) => x.headroom));
      const maxLabel = Math.max(
        ...rows.map((x) => LABEL_RANK[x.home.energyLabel])
      );
      const valueScore =
        r.valueVsP60 != null
          ? (r.valueVsP60 + 100_000) /
            Math.max(
              ...rows.map((x) => (x.valueVsP60 ?? -100_000) + 100_000)
            )
          : 0.5;
      const heatScore =
        r.derived.heat === 'cold'
          ? 1
          : r.derived.heat === 'medium'
          ? 0.7
          : 0.4;
      const total =
        (r.home.m2 / maxM2) * 0.2 +
        (r.headroom / Math.max(maxHead, 1)) * 0.25 +
        valueScore * 0.25 +
        heatScore * 0.15 +
        (LABEL_RANK[r.home.energyLabel] / maxLabel) * 0.15;
      return { ...r, total };
    })
    .sort((a, b) => b.total - a.total);

  const bestPick = scored[0];
  const fitsCount = rows.filter((r) => r.headroom >= 0).length;

  return (
    <div className="space-y-4">
      {/* Best-pick callout — bold */}
      {bestPick && (
        <div className="rounded-xl border-2 border-accent/60 bg-gradient-to-br from-accent/15 via-accent/5 to-transparent p-3 shadow-[0_0_40px_-12px_rgba(110,231,183,0.4)] sm:p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl bg-accent text-bg shadow-lg sm:h-11 sm:w-11">
                <Crown size={18} />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-semibold uppercase tracking-widest text-accent">
                  Beste keuze nu
                </div>
                <a
                  href={bestPick.home.fundaUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="block truncate text-lg font-bold text-text hover:text-accent sm:text-xl"
                >
                  {bestPick.home.address}
                </a>
                <div className="truncate text-[11px] text-muted sm:text-xs">
                  {fitsCount}/{rows.length} passen in budget · score o.b.v.
                  headroom, waarde, m², heat & label
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 sm:gap-x-6">
              <KPI label="bod" value={fmtEURk(bestPick.bid)} />
              <KPI label="cash" value={fmtEURk(bestPick.cashOut)} />
              <KPI
                label="over budget"
                value={fmtEURk(bestPick.headroom)}
                emphasised
              />
            </div>
          </div>
        </div>
      )}

      {/* Hero cards */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {rows.map((r) => (
          <HeroCard
            key={r.home.id}
            row={r}
            tags={signatures[r.home.id] ?? []}
            onBidChange={(v) => onBidChange(r.home.id, v)}
            onTaxatieChange={(v) => onTaxatieChange(r.home.id, v)}
            budgetK={controls.ownMoneyBudgetK}
            isBestPick={bestPick?.home.id === r.home.id}
          />
        ))}
      </div>
    </div>
  );
}

interface HeroRow {
  home: Home;
  i: number;
  derived: DerivedMetrics;
  bid: number;
  taxShortfall: number;
  taxatieValue: number;
  eg: ReturnType<typeof eigenGeldNeeded>;
  renov: number;
  cashOut: number;
  headroom: number;
  monthly: ReturnType<typeof totalMonthly>;
  valueVsP60: number | null;
}

function HeroCard({
  row,
  tags,
  onBidChange,
  onTaxatieChange,
  budgetK,
  isBestPick
}: {
  row: HeroRow;
  tags: SignatureTag[];
  onBidChange: (v: number) => void;
  onTaxatieChange: (v: number) => void;
  budgetK: number;
  isBestPick: boolean;
}) {
  const {
    home,
    derived,
    bid,
    taxShortfall,
    taxatieValue,
    eg,
    renov,
    cashOut,
    headroom,
    monthly,
    valueVsP60
  } = row;
  const pct = (bid / home.askPrice) * 100;
  const fits = headroom >= 0;
  const cap = mortgageCap(home.energyLabel);

  const markers: SliderMarker[] = [];
  if (home.huispedia) {
    markers.push(
      { value: home.huispedia.p40, label: 'p40' },
      { value: home.huispedia.p60, label: 'p60' },
      { value: home.huispedia.p80, label: 'p80' }
    );
  }
  markers.push({ value: home.askPrice, label: 'vraag', color: '#94a3b8' });

  return (
    <div
      className={`relative rounded-xl border bg-panel p-3 transition-shadow sm:p-4 ${
        isBestPick
          ? 'border-accent/60 shadow-[0_0_24px_-8px_rgba(110,231,183,0.35)]'
          : 'border-border'
      }`}
    >
      {isBestPick && (
        <div className="absolute -top-2 right-4 flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-bg shadow">
          <Crown size={11} /> Beste keuze
        </div>
      )}

      {/* Header */}
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <a
            href={home.fundaUrl}
            target="_blank"
            rel="noreferrer"
            className="truncate text-base font-semibold text-text underline-offset-4 hover:text-accent hover:underline"
          >
            {home.address}
          </a>
          <div className="mt-0.5 text-[11px] text-muted">
            {home.neighborhood ?? home.city}
            {home.aptType ? ` · ${home.aptType}` : ''}
            {' · '}
            <span className="text-text/70">
              markt: {HEAT_LABEL[derived.heat].toLowerCase()}
              {derived.viewsPerDay != null
                ? ` (${Math.round(derived.viewsPerDay)}/d)`
                : ''}
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-wide text-muted">
            vraag
          </div>
          <div className="font-mono text-sm font-semibold text-text">
            {fmtEUR(home.askPrice)}
          </div>
        </div>
      </div>

      {/* Signature tags — good / bad highlights */}
      {tags.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {tags
            .slice()
            .sort((a, b) => {
              const order = { good: 0, neutral: 1, bad: 2 } as const;
              return order[a.tone] - order[b.tone];
            })
            .map((t, i) => {
              const cls =
                t.tone === 'good'
                  ? 'border-accent/30 bg-accent/10 text-accent'
                  : t.tone === 'bad'
                  ? 'border-bad/30 bg-bad/10 text-bad'
                  : 'border-border bg-panel2/60 text-muted';
              return (
                <span
                  key={i}
                  className={`rounded-md border px-2 py-0.5 text-[10px] font-medium ${cls}`}
                  title={t.detail}
                >
                  {t.label} · {t.detail}
                </span>
              );
            })}
        </div>
      )}

      {/* Key facts grid — the most-important objective info, prominent */}
      <div className="mb-4 grid grid-cols-3 gap-1.5 rounded-lg border border-border bg-bg/30 p-2 sm:grid-cols-4">
        <Fact icon={<Ruler size={11} />} label="m²" value={`${home.m2}`} />
        <Fact
          icon={<Ruler size={11} />}
          label="€/m²"
          value={`€${Math.round(derived.pricePerM2).toLocaleString('nl-NL')}`}
        />
        <Fact
          icon={<Calendar size={11} />}
          label="bouwjaar"
          value={`${home.bouwjaar}`}
        />
        <Fact
          icon={<Zap size={11} />}
          label="label"
          value={home.energyLabel}
        />
        <Fact
          icon={<Wallet size={11} />}
          label="VvE/mnd"
          value={`€${home.vveMonthly}`}
        />
        <Fact
          icon={<Car size={11} />}
          label="parkeer"
          value={home.ownParking ? 'eigen' : 'openbaar'}
        />
        <Fact
          icon={<ArrowUpDown size={11} />}
          label="lift"
          value={home.hasLift ? 'ja' : 'nee'}
        />
        <Fact
          icon={<Box size={11} />}
          label="berging"
          value={home.storageM2 ? `${home.storageM2}m²` : '—'}
        />
        <Fact
          icon={<Trees size={11} />}
          label="buiten"
          value={home.outdoorSpace ?? '—'}
        />
        <Fact
          icon={<BedDouble size={11} />}
          label="slpkmrs"
          value={home.bedrooms ? `${home.bedrooms}` : '—'}
        />
        <Fact
          icon={<Building2 size={11} />}
          label="type"
          value={home.aptType ?? '—'}
        />
        <Fact
          icon={<Wallet size={11} />}
          label="renovatie"
          value={renov > 0 ? `€${Math.round(renov / 1000)}K` : 'geen'}
        />
      </div>

      {/* Bid + Taxatie sliders */}
      <div className="mb-4 space-y-4">
        <Slider
          label={
            <span>
              Bod ·{' '}
              <span className="font-mono text-text">{pct.toFixed(1)}%</span> van
              vraag · aanbevolen{' '}
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
          markers={markers}
        />

        <Slider
          label={
            <span>
              Geschatte taxatie ·{' '}
              <span className="font-mono text-text">
                {fmtEUR(taxatieValue)}
              </span>
            </span>
          }
          value={taxShortfall}
          onChange={onTaxatieChange}
          min={-2}
          max={10}
          step={0.5}
          formatValue={(v) =>
            v === 0
              ? 'gelijk aan bod'
              : v < 0
              ? `+${Math.abs(v).toFixed(1)}%`
              : `−${v.toFixed(1)}%`
          }
        />
      </div>

      {/* 5 financial KPI tiles */}
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 md:grid-cols-5">
        <Tile
          label="Cash totaal"
          value={fmtEURk(cashOut)}
          sub={renov ? `+€${Math.round(renov / 1000)}K renov` : 'eg + KK'}
        />
        <Tile
          label={fits ? 'Over budget' : 'Tekort'}
          value={fmtEURk(Math.abs(headroom))}
          sub={`van €${budgetK}K`}
          tone={fits ? 'default' : 'bad'}
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
            eg.capGap > 0 && eg.taxatieGap > 0
              ? 'cap+tax bind'
              : eg.capGap > 0
              ? `cap-bind ${fmtEURk(cap)}`
              : eg.taxatieGap > 0
              ? `tax-bind ${fmtEURk(taxatieValue)}`
              : `cap ${fmtEURk(cap)}`
          }
          tone={eg.gap > 0 ? 'warn' : 'default'}
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
            tone={valueVsP60 >= 0 ? 'default' : 'bad'}
          />
        ) : (
          <Tile label="Bod v.s. p60" value="—" sub="geen huispedia" />
        )}
      </div>
    </div>
  );
}

function Fact({
  icon,
  label,
  value
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-md bg-panel2/60 px-2 py-1">
      <div className="flex items-center gap-1 text-[9px] uppercase tracking-wide text-muted">
        {icon}
        {label}
      </div>
      <div className="truncate font-mono text-xs font-semibold text-text">
        {value}
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
  tone?: 'default' | 'bad' | 'warn';
}) {
  const valueClass =
    tone === 'bad'
      ? 'text-bad'
      : tone === 'warn'
      ? 'text-warn'
      : 'text-text';
  return (
    <div className="rounded-md border border-border bg-panel2/40 px-2 py-1.5">
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
  emphasised = false
}: {
  label: string;
  value: string;
  emphasised?: boolean;
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-muted">
        {label}
      </div>
      <div
        className={`font-mono text-base font-semibold ${
          emphasised ? 'text-accent' : 'text-text'
        }`}
      >
        {value}
      </div>
    </div>
  );
}
