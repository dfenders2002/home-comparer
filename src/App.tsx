import { useMemo, useState } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import {
  Home as HomeIcon,
  Sliders,
  TrendingUp,
  GitFork as ScatterIcon,
  Radar,
  Table2,
  ListChecks
} from 'lucide-react';

import { HOMES } from './data/homes';
import { DEFAULTS } from './data/constants';
import { derive, popularityScores } from './lib/derived';

import { ControlsPanel, GlobalControls } from './components/ControlsPanel';
import { ComparisonTable } from './components/ComparisonTable';
import { BidSimulator } from './components/BidSimulator';
import { ValueRangeChart } from './components/ValueRangeChart';
import { ProjectionChart } from './components/ProjectionChart';
import { PopularityScatter } from './components/PopularityScatter';
import { RadarOverlay } from './components/RadarOverlay';
import { ProsConsCards } from './components/ProsConsCards';
import { BidStrip } from './components/BidStrip';

const TABS = [
  { id: 'overview',   label: 'Overzicht',   icon: HomeIcon },
  { id: 'table',      label: 'Tabel',       icon: Table2 },
  { id: 'bids',       label: 'Bod & geld',  icon: Sliders },
  { id: 'value',      label: 'Waardering',  icon: TrendingUp },
  { id: 'projection', label: '8-jaars',     icon: TrendingUp },
  { id: 'popularity', label: 'Markt-heat',  icon: ScatterIcon },
  { id: 'radar',      label: 'Radar',       icon: Radar },
  { id: 'proscons',   label: 'Pro / Con',   icon: ListChecks }
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

  // Initial bid = asking price for each home
  const [bids, setBids] = useState<Record<string, number>>(() =>
    Object.fromEntries(HOMES.map((h) => [h.id, h.askPrice]))
  );

  const popScores = useMemo(() => popularityScores(HOMES), []);
  const derived = useMemo(
    () => HOMES.map((h) => derive(h, popScores[h.id])),
    [popScores]
  );

  const updateControls = (patch: Partial<GlobalControls>) =>
    setControls((c) => ({ ...c, ...patch }));

  const updateBid = (id: string) => (v: number) =>
    setBids((b) => ({ ...b, [id]: v }));

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-border bg-bg/85 backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-accent text-bg">
              <HomeIcon size={18} />
            </div>
            <div>
              <div className="text-base font-semibold text-text">
                Home Comparer
              </div>
              <div className="text-xs text-muted">
                Alphen aan den Rijn · {HOMES.length} appartementen
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

      <main className="mx-auto max-w-[1400px] space-y-5 px-6 py-6">
        <ControlsPanel values={controls} onChange={updateControls} />

        <Tabs.Root defaultValue="overview" className="space-y-4">
          <Tabs.List className="flex flex-wrap gap-1 rounded-xl border border-border bg-panel p-1">
            {TABS.map((t) => {
              const Icon = t.icon;
              return (
                <Tabs.Trigger
                  key={t.id}
                  value={t.id}
                  className="group flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:text-text data-[state=active]:bg-panel2 data-[state=active]:text-text"
                >
                  <Icon size={13} className="opacity-70 group-data-[state=active]:opacity-100" />
                  {t.label}
                </Tabs.Trigger>
              );
            })}
          </Tabs.List>

          {/* OVERVIEW */}
          <Tabs.Content value="overview" className="space-y-4 focus:outline-none">
            <BidStrip
              homes={HOMES}
              bids={bids}
              onBidChange={(id, v) => setBids((b) => ({ ...b, [id]: v }))}
              controls={controls}
            />
            <ComparisonTable
              homes={HOMES}
              derived={derived}
              bids={bids}
              controls={controls}
            />
            <ProsConsCards homes={HOMES} />
          </Tabs.Content>

          {/* TABLE */}
          <Tabs.Content value="table" className="focus:outline-none">
            <ComparisonTable
              homes={HOMES}
              derived={derived}
              bids={bids}
              controls={controls}
            />
          </Tabs.Content>

          {/* BIDS */}
          <Tabs.Content value="bids" className="space-y-4 focus:outline-none">
            {HOMES.map((h) => (
              <BidSimulator
                key={h.id}
                home={h}
                bid={bids[h.id]}
                onBidChange={updateBid(h.id)}
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
            <ProjectionChart homes={HOMES} bids={bids} controls={controls} />
          </Tabs.Content>

          {/* POPULARITY */}
          <Tabs.Content value="popularity" className="focus:outline-none">
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
