import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Home } from '../data/homes';
import { Card } from './ui/Card';
import { GlobalControls } from './ControlsPanel';
import { netAtExit, fmtEURk } from '../lib/finance';

interface Props {
  homes: Home[];
  bids: Record<string, number>;
  controls: GlobalControls;
}

const COLORS = ['#6ee7b7', '#fbbf24', '#60a5fa', '#f472b6', '#a78bfa'];

export function ProjectionChart({ homes, bids, controls }: Props) {
  const maxYears = Math.max(controls.exitHorizonYears, 12);

  // Build per-year rows: { year, [homeId]: netAtExit }
  const rows: Array<Record<string, number>> = [];
  for (let y = 0; y <= maxYears; y++) {
    const row: Record<string, number> = { year: y };
    for (const h of homes) {
      const bid = bids[h.id] ?? h.askPrice;
      row[h.id] = netAtExit(
        bid,
        h.energyLabel,
        controls.ratePct,
        controls.termYears,
        controls.growthPctPerYear,
        y,
        2,
        controls.taxatieShortfallPct
      );
    }
    rows.push(row);
  }

  return (
    <Card
      title={`Netto bij verkoop (na ${controls.growthPctPerYear}% groei/jaar)`}
      subtitle="Verkoopprijs − resterende hypotheek − 2% makelaarskosten"
    >
      <div className="h-80 w-full">
        <ResponsiveContainer>
          <LineChart data={rows} margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#252b34" />
            <XAxis
              dataKey="year"
              stroke="#7b8794"
              fontSize={11}
              tickFormatter={(v) => `${v}j`}
            />
            <YAxis
              stroke="#7b8794"
              fontSize={11}
              tickFormatter={(v) => fmtEURk(v)}
              width={55}
            />
            <Tooltip
              contentStyle={{
                background: '#13171c',
                border: '1px solid #252b34',
                borderRadius: 8,
                fontSize: 12
              }}
              labelFormatter={(v) => `${v} jaar`}
              formatter={(v: number, name: string) => {
                const home = homes.find((h) => h.id === name);
                return [fmtEURk(v), home?.address ?? name];
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: 11 }}
              formatter={(value: string) =>
                homes.find((h) => h.id === value)?.address ?? value
              }
            />
            {homes.map((h, i) => (
              <Line
                key={h.id}
                type="monotone"
                dataKey={h.id}
                stroke={COLORS[i % COLORS.length]}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            ))}
            {/* highlight current exit horizon */}
            <Line
              type="monotone"
              dataKey={() => null}
              stroke="transparent"
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-3">
        {homes.map((h, i) => {
          const bid = bids[h.id] ?? h.askPrice;
          const net = netAtExit(
            bid,
            h.energyLabel,
            controls.ratePct,
            controls.termYears,
            controls.growthPctPerYear,
            controls.exitHorizonYears,
            2,
            controls.taxatieShortfallPct
          );
          return (
            <div
              key={h.id}
              className="flex items-center justify-between rounded-lg border border-border bg-panel2/60 px-3 py-2 text-xs"
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: COLORS[i % COLORS.length] }}
                />
                <span className="text-text">{h.address}</span>
              </div>
              <div className="font-mono text-text">
                netto na {controls.exitHorizonYears}j: {fmtEURk(net)}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
