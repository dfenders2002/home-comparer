import { Home } from '../data/homes';
import { Card } from './ui/Card';
import { Check, X } from 'lucide-react';

interface Props {
  homes: Home[];
}

export function ProsConsCards({ homes }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {homes.map((h) => (
        <Card
          key={h.id}
          title={
            <a
              href={h.fundaUrl}
              target="_blank"
              rel="noreferrer"
              className="underline-offset-4 hover:text-accent hover:underline"
            >
              {h.address}
            </a>
          }
          subtitle={
            <span>
              {h.m2}m² · {h.bouwjaar} · label {h.energyLabel}
            </span>
          }
        >
          <div className="space-y-3">
            {h.pros && (
              <div>
                <div className="mb-1.5 text-[11px] uppercase tracking-wide text-good">
                  Pro
                </div>
                <ul className="space-y-1">
                  {h.pros.map((p, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-xs">
                      <Check size={12} className="mt-0.5 flex-shrink-0 text-good" />
                      <span className="text-text">{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {h.cons && (
              <div>
                <div className="mb-1.5 text-[11px] uppercase tracking-wide text-bad">
                  Contra
                </div>
                <ul className="space-y-1">
                  {h.cons.map((c, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-xs">
                      <X size={12} className="mt-0.5 flex-shrink-0 text-bad" />
                      <span className="text-text">{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
