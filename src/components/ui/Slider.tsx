import * as RadixSlider from '@radix-ui/react-slider';
import { ReactNode } from 'react';

export interface SliderMarker {
  value: number;
  label: string;
  color?: string;
}

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
  markers?: SliderMarker[];
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
  accent = '#7b8794',          // muted slate by default
  markers
}: SliderProps) {
  const span = max - min || 1;
  const pctOf = (v: number) => ((v - min) / span) * 100;

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between text-xs">
        <div className="font-medium text-text/80">{label}</div>
        <div className="font-mono text-text">
          {formatValue ? formatValue(value) : value}
        </div>
      </div>
      <div className="relative pb-5">
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
          {markers?.map((m, i) => {
            const left = pctOf(m.value);
            if (left < 0 || left > 100) return null;
            return (
              <div
                key={i}
                className="pointer-events-none absolute top-0 flex h-full flex-col items-center"
                style={{ left: `${left}%`, transform: 'translateX(-50%)' }}
              >
                <div
                  className="h-3 w-px"
                  style={{ background: m.color ?? '#9ca3af', opacity: 0.7 }}
                />
              </div>
            );
          })}
          <RadixSlider.Thumb
            className="block h-4 w-4 rounded-full border-2 border-bg bg-text/90 shadow-md transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:ring-offset-1 focus:ring-offset-bg"
            aria-label={typeof label === 'string' ? label : 'slider'}
          />
        </RadixSlider.Root>
        {/* marker labels */}
        {markers && markers.length > 0 && (
          <div className="absolute inset-x-0 top-5 h-4">
            {markers.map((m, i) => {
              const left = pctOf(m.value);
              if (left < 0 || left > 100) return null;
              return (
                <span
                  key={i}
                  className="absolute font-mono text-[9px]"
                  style={{
                    left: `${left}%`,
                    transform: 'translateX(-50%)',
                    color: m.color ?? '#9ca3af'
                  }}
                >
                  {m.label}
                </span>
              );
            })}
          </div>
        )}
      </div>
      {hint && <div className="text-[10px] text-muted">{hint}</div>}
    </div>
  );
}
