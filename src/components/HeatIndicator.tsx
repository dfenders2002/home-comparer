import { Home } from '../data/homes';
import { Card } from './ui/Card';
import { DerivedMetrics, HEAT_COLOR, HEAT_LABEL } from '../lib/derived';
import { Eye, Bookmark, CalendarDays, Flame } from 'lucide-react';

interface Props {
  homes: Home[];
  derived: DerivedMetrics[];
}

export function HeatIndicator({ homes, derived }: Props) {
  return (
    <Card
      title="Markt-heat per woning"
      subtitle="Views/dag bepaalt aanbevolen bod-zone. Koud → onder vraag. Vuur → boven Huispedia p60."
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {homes.map((h, i) => {
          const d = derived[i];
          const color = HEAT_COLOR[d.heat];
          return (
            <div
              key={h.id}
              className="space-y-2.5 rounded-lg border border-border bg-panel2/60 p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-text">
                    {h.address}
                  </div>
                  <div className="text-[11px] text-muted">
                    sinds {h.popularity.listedOn ?? '—'}
                  </div>
                </div>
                <div
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold"
                  style={{ background: color + '22', color }}
                >
                  <Flame size={12} /> {HEAT_LABEL[d.heat]}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                <Metric
                  icon={<Eye size={11} />}
                  label="views/dag"
                  value={
                    d.viewsPerDay != null
                      ? Math.round(d.viewsPerDay).toString()
                      : '—'
                  }
                  emphasised
                  color={color}
                />
                <Metric
                  icon={<Bookmark size={11} />}
                  label="bewaard"
                  value={(h.popularity.saves ?? 0).toString()}
                />
                <Metric
                  icon={<CalendarDays size={11} />}
                  label="dagen"
                  value={(h.popularity.daysOnFunda ?? 0).toString()}
                />
              </div>

              <div className="rounded-md border border-border bg-bg/40 p-2">
                <div className="text-[10px] uppercase tracking-wide text-muted">
                  Aanbevolen bod-zone
                </div>
                <div className="font-mono text-sm font-semibold" style={{ color }}>
                  {d.suggestedBidPctRange[0]}–{d.suggestedBidPctRange[1]}%{' '}
                  <span className="text-xs text-muted">van vraag</span>
                </div>
                <div className="text-[10px] text-muted">
                  ≈{' '}
                  €
                  {Math.round(
                    (h.askPrice * d.suggestedBidPctRange[0]) / 100 / 1000
                  )}
                  K – €
                  {Math.round(
                    (h.askPrice * d.suggestedBidPctRange[1]) / 100 / 1000
                  )}
                  K
                </div>
              </div>

              {h.huispedia && (
                <div className="grid grid-cols-3 gap-1 text-center text-[10px] text-muted">
                  <div>
                    p40
                    <div className="font-mono text-text">
                      €{Math.round(h.huispedia.p40 / 1000)}K
                    </div>
                  </div>
                  <div>
                    p60
                    <div className="font-mono text-text">
                      €{Math.round(h.huispedia.p60 / 1000)}K
                    </div>
                  </div>
                  <div>
                    p80
                    <div className="font-mono text-text">
                      €{Math.round(h.huispedia.p80 / 1000)}K
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function Metric({
  icon,
  label,
  value,
  emphasised,
  color
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  emphasised?: boolean;
  color?: string;
}) {
  return (
    <div className="rounded-md bg-bg/40 px-2 py-1.5">
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted">
        {icon}
        {label}
      </div>
      <div
        className={`font-mono ${emphasised ? 'text-sm font-semibold' : 'text-xs'}`}
        style={emphasised ? { color: color ?? '#e6edf3' } : undefined}
      >
        {value}
      </div>
    </div>
  );
}
