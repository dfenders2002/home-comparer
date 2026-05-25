import { useMemo, useState } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import {
  Home as HomeIcon,
  Sliders,
  TrendingUp,
  GitFork as ScatterIcon,
  Radar,
  Table2,
  ListChecks,
  LayoutDashboard
} from 'lucide-react';

import { HOMES } from './data/homes';
import { DEFAULTS } from './data/constants';
import { derive } from './lib/derived';

import { ControlsPanel, GlobalControls } from './components/ControlsPanel';
import { ComparisonTable } from './components/ComparisonTable';
import { BidSimulator } from './components/BidSimulator';
import { ValueRangeChart } from './components/ValueRangeChart';
import { ProjectionChart } from './components/ProjectionChart';
import { PopularityScatter } from './components/PopularityScatter';
import { RadarOverlay } from './components/RadarOverlay';
import { ProsConsCards } from './components/ProsConsCards';
import { HeatIndicator } from './components/HeatIndicator';
import { Summary } from './components/Summary';

const TABS = [
  { id: 'summary',    label: 'Samenvatting', icon: LayoutDashboard },
  { id: 'bids',       label: 'Bod & geld',   icon: Sliders },
  { id: 'value',      label: 'Waardering',   icon: TrendingUp },
  { id: 'projection', label: '8-jaars',      icon: TrendingUp },
  { id: 'popularity', label: 'Markt-heat',   icon: ScatterIcon },
  { id: 'radar',      label: 'Radar',        icon: Radar },
  { id: 'table',      label: 'Detail-tabel', icon: Table2 },
  { id: 'proscons',   label: 'Pro / Con',    icon: ListChecks }
];

export default function App() {
  const [controls, setControls] = useState<GlobalControls>({
    ratePct: DEFAULTS.ratePct,
    termYears: DEFAULTS.termYears,
    kostenKoperPct: DEFAULTS.kostenKoperPct,
    ownMoneyBudgetK: DEFAULTS.ownMoneyBudgetK,
    exitHorizonYears: DEFAULTS.exitHorizonYears,
    growthPctPerYear: DEFAULTS.growthPctPerYear
  });

  // Initial bids: hot homes on huispedia p80, cool homes on vraagprijs
  const [bids, setBids] = useState<Record<string, number>>(() => {
    const m: Record<string, number> = {};
    for (const h of HOMES) {
      if (h.id === 'gravenstraat-93' && h.huispedia)
        m[h.id] = h.huispedia.p80;
      else if (h.id === 'abel-tasmanstraat-128' && h.huispedia)
        m[h.id] = h.huispedia.p80;
      else m[h.id] = h.askPrice;
    }
    return m;
  });

  // Per-home taxatie shortfall %. 0 = taxatie equals bid (best case).
  const [taxaties, setTaxaties] = useState<Record<string, number>>(() =>
    Object.fromEntries(HOMES.map((h) => [h.id, 0]))
  );

  const derived = useMemo(() => HOMES.map((h) => derive(h)), []);

  const updateControls = (patch: Partial<GlobalControls>) =>
    setControls((c) => ({ ...c, ...patch }));

  const updateBid = (id: string) => (v: number) =>
    setBids((b) => ({ ...b, [id]: v }));

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-border bg-bg/85 backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <div className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg bg-accent text-bg sm:h-9 sm:w-9">
              <HomeIcon size={16} />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-text sm:text-base">
                Home Comparer
              </div>
              <div className="truncate text-[11px] text-muted sm:text-xs">
                Alphen a/d Rijn · {HOMES.length} appartementen
              </div>
            </div>
          </div>
          <div className="hidden text-right text-xs text-muted md:block">
            Eigen geld budget:{' '}
            <span className="font-mono text-text">
              €{controls.ownMoneyBudgetK}K
            </span>{' '}
            · rente{' '}
            <span className="font-mono text-text">
              {controls.ratePct.toFixed(2)}%
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] space-y-4 px-3 py-4 sm:space-y-5 sm:px-6 sm:py-6">
        <ControlsPanel values={controls} onChange={updateControls} />

        <Tabs.Root defaultValue="summary" className="space-y-4">
          <Tabs.List className="-mx-3 flex gap-1 overflow-x-auto rounded-none border-y border-border bg-panel px-3 py-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:rounded-xl sm:border">
            {TABS.map((t) => {
              const Icon = t.icon;
              return (
                <Tabs.Trigger
                  key={t.id}
                  value={t.id}
                  className="group flex flex-shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted transition-colors hover:text-text data-[state=active]:bg-panel2 data-[state=active]:text-text sm:px-3"
                >
                  <Icon size={13} className="opacity-70 group-data-[state=active]:opacity-100" />
                  {t.label}
                </Tabs.Trigger>
              );
            })}
          </Tabs.List>

          {/* SUMMARY (default) */}
          <Tabs.Content value="summary" className="focus:outline-none">
            <Summary
              homes={HOMES}
              derived={derived}
              bids={bids}
              onBidChange={(id, v) => setBids((b) => ({ ...b, [id]: v }))}
              taxaties={taxaties}
              onTaxatieChange={(id, v) =>
                setTaxaties((t) => ({ ...t, [id]: v }))
              }
              controls={controls}
            />
          </Tabs.Content>

          {/* TABLE */}
          <Tabs.Content value="table" className="focus:outline-none">
            <ComparisonTable
              homes={HOMES}
              derived={derived}
              bids={bids}
              taxaties={taxaties}
              controls={controls}
            />
          </Tabs.Content>

          {/* BIDS */}
          <Tabs.Content value="bids" className="space-y-4 focus:outline-none">
            {HOMES.map((h, i) => (
              <BidSimulator
                key={h.id}
                home={h}
                derived={derived[i]}
                bid={bids[h.id]}
                onBidChange={updateBid(h.id)}
                taxatieShortfallPct={taxaties[h.id]}
                onTaxatieChange={(v) =>
                  setTaxaties((t) => ({ ...t, [h.id]: v }))
                }
                controls={controls}
              />
            ))}
          </Tabs.Content>

          {/* VALUE */}
          <Tabs.Content value="value" className="space-y-4 focus:outline-none">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {HOMES.map((h) => (
                <ValueRangeChart key={h.id} home={h} bid={bids[h.id]} />
              ))}
            </div>
          </Tabs.Content>

          {/* PROJECTION */}
          <Tabs.Content value="projection" className="focus:outline-none">
            <ProjectionChart
              homes={HOMES}
              bids={bids}
              taxaties={taxaties}
              controls={controls}
            />
          </Tabs.Content>

          {/* POPULARITY */}
          <Tabs.Content value="popularity" className="space-y-4 focus:outline-none">
            <HeatIndicator homes={HOMES} derived={derived} />
            <PopularityScatter homes={HOMES} derived={derived} />
          </Tabs.Content>

          {/* RADAR */}
          <Tabs.Content value="radar" className="focus:outline-none">
            <RadarOverlay homes={HOMES} derived={derived} />
          </Tabs.Content>

          {/* PROS / CONS */}
          <Tabs.Content value="proscons" className="focus:outline-none">
            <ProsConsCards homes={HOMES} />
          </Tabs.Content>
        </Tabs.Root>

        <footer className="pt-4 text-center text-[11px] text-muted">
          Data in <span className="font-mono">src/data/homes.ts</span> — paste
          nieuwe woning-info in chat en Claude voegt 'm toe.
        </footer>
      </main>
    </div>
  );
}
