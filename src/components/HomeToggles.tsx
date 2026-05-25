import { Home } from '../data/homes';
import { Card } from './ui/Card';
import { Check } from 'lucide-react';

interface Props {
  homes: Home[];
  enabled: Set<string>;
  onToggle: (id: string) => void;
  onAll: (state: boolean) => void;
}

export function HomeToggles({ homes, enabled, onToggle, onAll }: Props) {
  const enabledCount = homes.filter((h) => enabled.has(h.id)).length;
  const allOn = enabledCount === homes.length;

  return (
    <Card>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          {homes.map((h) => {
            const on = enabled.has(h.id);
            return (
              <button
                key={h.id}
                type="button"
                onClick={() => onToggle(h.id)}
                className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                  on
                    ? 'border-accent/40 bg-accent/10 text-accent'
                    : 'border-border bg-panel2/40 text-muted hover:text-text'
                }`}
              >
                <span
                  className={`grid h-3.5 w-3.5 place-items-center rounded-full border ${
                    on
                      ? 'border-accent bg-accent text-bg'
                      : 'border-muted'
                  }`}
                >
                  {on && <Check size={9} strokeWidth={3} />}
                </span>
                <span className={on ? '' : 'line-through decoration-muted/50'}>
                  {h.address}
                </span>
              </button>
            );
          })}
        </div>
        <div className="flex items-center justify-between gap-3 text-[11px] text-muted sm:justify-end">
          <span>
            {enabledCount}/{homes.length} in vergelijking
          </span>
          <button
            type="button"
            onClick={() => onAll(!allOn)}
            className="rounded-md border border-border bg-panel2/40 px-2 py-1 text-xs text-text hover:bg-panel2"
          >
            {allOn ? 'Alles uit' : 'Alles aan'}
          </button>
        </div>
      </div>
    </Card>
  );
}
