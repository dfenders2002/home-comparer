import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
  LabelList
} from 'recharts';
import { Home } from '../data/homes';
import { DerivedMetrics } from '../lib/derived';
import { Card } from './ui/Card';

interface Props {
  homes: Home[];
  derived: DerivedMetrics[];
}

const COLORS = ['#6ee7b7', '#fbbf24', '#60a5fa', '#f472b6', '#a78bfa'];

export function PopularityScatter({ homes, derived }: Props) {
  const points = homes.map((h, i) => ({
    id: h.id,
    label: h.address.split(' ')[0],
    address: h.address,
    pricePerM2: Math.round(derived[i].pricePerM2),
    days: h.popularity.daysOnFunda ?? 0,
    m2: h.m2
  }));

  const avgPpm =
    points.reduce((s, p) => s + p.pricePerM2, 0) / Math.max(points.length, 1);
  const avgDays =
    points.reduce((s, p) => s + p.days, 0) / Math.max(points.length, 1);

  return (
    <Card
      title="Populariteit vs prijs/m²"
      subtitle="X = €/m², Y = dagen op Funda (hoger = kouder = meer biedmarge). Bubbel = m²."
    >
      <div className="h-72 w-full">
        <ResponsiveContainer>
          <ScatterChart margin={{ top: 20, right: 20, bottom: 30, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#252b34" />
            <XAxis
              type="number"
              dataKey="pricePerM2"
              name="€/m²"
              stroke="#7b8794"
              fontSize={11}
              tickFormatter={(v) => `€${(v / 1000).toFixed(1)}K`}
              label={{
                value: 'Prijs / m²',
                position: 'insideBottom',
                offset: -15,
                fill: '#7b8794',
                fontSize: 11
              }}
              domain={['dataMin - 200', 'dataMax + 200']}
            />
            <YAxis
              type="number"
              dataKey="days"
              name="dagen op Funda"
              stroke="#7b8794"
              fontSize={11}
              label={{
                value: 'Dagen op Funda',
                angle: -90,
                position: 'insideLeft',
                fill: '#7b8794',
                fontSize: 11
              }}
              domain={[0, 'dataMax + 5']}
            />
            <ZAxis type="number" dataKey="m2" range={[200, 800]} />
            <Tooltip
              contentStyle={{
                background: '#13171c',
                border: '1px solid #252b34',
                borderRadius: 8,
                fontSize: 12
              }}
              formatter={(v: any, name: string) => {
                if (name === 'pricePerM2')
                  return [`€${v.toLocaleString('nl-NL')}`, '€/m²'];
                if (name === 'days') return [`${v} dagen`, 'op Funda'];
                if (name === 'm2') return [`${v} m²`, 'oppervlakte'];
                return [v, name];
              }}
              labelFormatter={() => ''}
              cursor={{ strokeDasharray: '3 3' }}
            />
            <ReferenceLine
              x={avgPpm}
              stroke="#7b8794"
              strokeDasharray="2 4"
              label={{
                value: 'avg',
                fill: '#7b8794',
                fontSize: 10,
                position: 'top'
              }}
            />
            <ReferenceLine
              y={avgDays}
              stroke="#7b8794"
              strokeDasharray="2 4"
            />
            <Scatter data={points}>
              {points.map((_p, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
              <LabelList
                dataKey="label"
                position="top"
                fill="#e6edf3"
                fontSize={11}
              />
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted md:grid-cols-4">
        <Quadrant
          color="#34d399"
          label="Linksboven"
          hint="Goedkoop + koud = beste bod-marge"
        />
        <Quadrant
          color="#fbbf24"
          label="Rechtsboven"
          hint="Duur maar koud"
        />
        <Quadrant
          color="#94a3b8"
          label="Linksonder"
          hint="Goedkoop maar hot"
        />
        <Quadrant
          color="#f87171"
          label="Rechtsonder"
          hint="Duur + hot — overbieden"
        />
      </div>
    </Card>
  );
}

function Quadrant({
  color,
  label,
  hint
}: {
  color: string;
  label: string;
  hint: string;
}) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-border bg-panel2/40 px-2 py-1.5">
      <span
        className="mt-0.5 inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full"
        style={{ background: color }}
      />
      <div>
        <div className="text-text">{label}</div>
        <div className="text-[10px]">{hint}</div>
      </div>
    </div>
  );
}
