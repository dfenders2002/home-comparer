import * as RadixSlider from '@radix-ui/react-slider';
import { ReactNode } from 'react';

interface SliderProps {
  label: ReactNode;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  formatValue?: (v: number) => string;
  hint?: ReactNode;
  accent?: string;
}

export function Slider({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  formatValue,
  hint,
  accent = '#6ee7b7'
}: SliderProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between text-xs">
        <div className="font-medium text-text/80">{label}</div>
        <div className="font-mono text-text" style={{ color: accent }}>
          {formatValue ? formatValue(value) : value}
        </div>
      </div>
      <RadixSlider.Root
        className="relative flex h-5 w-full touch-none select-none items-center"
        value={[value]}
        onValueChange={(v) => onChange(v[0])}
        min={min}
        max={max}
        step={step}
      >
        <RadixSlider.Track className="relative h-1.5 grow rounded-full bg-border">
          <RadixSlider.Range
            className="absolute h-full rounded-full"
            style={{ background: accent }}
          />
        </RadixSlider.Track>
        <RadixSlider.Thumb
          className="block h-4 w-4 rounded-full border-2 border-bg shadow-md transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-bg"
          style={{ background: accent, boxShadow: `0 0 0 1px ${accent}` }}
          aria-label={typeof label === 'string' ? label : 'slider'}
        />
      </RadixSlider.Root>
      {hint && <div className="text-[10px] text-muted">{hint}</div>}
    </div>
  );
}
