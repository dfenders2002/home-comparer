import { Slider } from './ui/Slider';
import { Card } from './ui/Card';

export interface GlobalControls {
  ratePct: number;
  termYears: number;
  kostenKoperPct: number;
  ownMoneyBudgetK: number;
  exitHorizonYears: number;
  growthPctPerYear: number;
  taxatieShortfallPct: number;
}

interface Props {
  values: GlobalControls;
  onChange: (patch: Partial<GlobalControls>) => void;
}

export function ControlsPanel({ values, onChange }: Props) {
  return (
    <Card
      title="Globale aannames"
      subtitle="Sleep om alle berekeningen live aan te passen"
    >
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
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
        <Slider
          label="Taxatie tegenvallend"
          value={values.taxatieShortfallPct}
          min={0}
          max={10}
          step={0.5}
          formatValue={(v) => (v === 0 ? 'gelijk aan bod' : `−${v.toFixed(1)}%`)}
          onChange={(v) => onChange({ taxatieShortfallPct: v })}
          hint="Stress-test: hoeveel onder bod komt taxatie?"
          accent="#fbbf24"
        />
      </div>
    </Card>
  );
}
