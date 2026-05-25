import { useState } from 'react';
import { Slider } from './ui/Slider';
import { Card } from './ui/Card';
import { ChevronDown, ChevronUp, SlidersHorizontal } from 'lucide-react';

export interface GlobalControls {
  ratePct: number;
  termYears: number;
  kostenKoperPct: number;
  ownMoneyBudgetK: number;
  exitHorizonYears: number;
  growthPctPerYear: number;
}

interface Props {
  values: GlobalControls;
  onChange: (patch: Partial<GlobalControls>) => void;
}

export function ControlsPanel({ values, onChange }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <Card>
      {/* Mobile collapsed header */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 text-left sm:hidden"
        aria-expanded={open}
      >
        <div className="flex min-w-0 items-center gap-2 text-xs text-text">
          <SlidersHorizontal size={13} className="flex-shrink-0 text-muted" />
          <span className="font-medium">Globale aannames</span>
          <span className="truncate text-muted">
            · {values.ratePct.toFixed(2)}% · €{values.ownMoneyBudgetK}K
          </span>
        </div>
        {open ? (
          <ChevronUp size={14} className="flex-shrink-0 text-muted" />
        ) : (
          <ChevronDown size={14} className="flex-shrink-0 text-muted" />
        )}
      </button>

      {/* Desktop header */}
      <div className="hidden items-center justify-between sm:flex">
        <div>
          <div className="text-sm font-semibold text-text">
            Globale aannames
          </div>
          <div className="mt-0.5 text-xs text-muted">
            Sleep om alle berekeningen live aan te passen
          </div>
        </div>
      </div>

      {/* Sliders — always visible on sm+, collapsible on mobile */}
      <div
        className={`mt-3 grid-cols-1 gap-5 sm:!grid sm:grid-cols-3 lg:grid-cols-6 ${
          open ? 'grid' : 'hidden'
        }`}
      >
        <Slider
          label="Hypotheekrente"
          value={values.ratePct}
          min={2}
          max={6}
          step={0.05}
          formatValue={(v) => `${v.toFixed(2)}%`}
          onChange={(v) => onChange({ ratePct: v })}
          hint="10 jaar vast NHG"
        />
        <Slider
          label="Looptijd"
          value={values.termYears}
          min={10}
          max={30}
          step={1}
          formatValue={(v) => `${v} jaar`}
          onChange={(v) => onChange({ termYears: v })}
        />
        <Slider
          label="Kosten koper"
          value={values.kostenKoperPct}
          min={1}
          max={5}
          step={0.1}
          formatValue={(v) => `${v.toFixed(1)}%`}
          onChange={(v) => onChange({ kostenKoperPct: v })}
          hint="Notaris, taxatie, advies, NHG"
        />
        <Slider
          label="Eigen geld budget"
          value={values.ownMoneyBudgetK}
          min={50}
          max={150}
          step={2.5}
          formatValue={(v) => `€${v}K`}
          onChange={(v) => onChange({ ownMoneyBudgetK: v })}
        />
        <Slider
          label="Exit horizon"
          value={values.exitHorizonYears}
          min={1}
          max={20}
          step={1}
          formatValue={(v) => `${v} jaar`}
          onChange={(v) => onChange({ exitHorizonYears: v })}
        />
        <Slider
          label="Waardestijging"
          value={values.growthPctPerYear}
          min={0}
          max={12}
          step={0.5}
          formatValue={(v) => `${v.toFixed(1)}%/jr`}
          onChange={(v) => onChange({ growthPctPerYear: v })}
        />
      </div>
    </Card>
  );
}
