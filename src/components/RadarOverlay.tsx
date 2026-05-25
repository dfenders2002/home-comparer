import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Home } from '../data/homes';
import { DerivedMetrics, radarVector } from '../lib/derived';
import { Card } from './ui/Card';

interface Props {
  homes: Home[];
  derived: DerivedMetrics[];
}

const COLORS = ['#6ee7b7', '#fbbf24', '#60a5fa', '#f472b6', '#a78bfa'];

export function RadarOverlay({ homes, derived }: Props) {
  const vectors = homes.map((h, i) => radarVector(h, derived[i], homes, derived));
  const metrics = vectors[0].map((v) => v.metric);

  // Reshape to one row per metric, with one column per home
  const data = metrics.map((m, mi) => {
    const row: Record<string, any> = { metric: m };
    homes.forEach((h, hi) => {
      row[h.id] = vectors[hi][mi].value;
      row[`${h.id}_raw`] = vectors[hi][mi].raw;
    });
    return row;
  });

  return (
    <Card
      title="Multi-metriek radar"
      subtitle="Genormaliseerd 0–1 over de dataset. Groter polygoon = beter overall."
    >
      <div className="h-96 w-full">
        <ResponsiveContainer>
          <RadarChart data={data} outerRadius={130}>
            <PolarGrid stroke="#252b34" />
            <PolarAngleAxis
              dataKey="metric"
              stroke="#e6edf3"
              fontSize={11}
              tick={{ fill: '#e6edf3' }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 1]}
              tick={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                background: '#13171c',
                border: '1px solid #252b34',
                borderRadius: 8,
                fontSize: 12
              }}
              formatter={(value: number, name: string, props: any) => {
                const raw = props.payload[`${name}_raw`];
                const home = homes.find((h) => h.id === name);
                return [`${raw} (${(value * 100).toFixed(0)}%)`, home?.address];
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: 11 }}
              formatter={(value: string) =>
                homes.find((h) => h.id === value)?.address ?? value
              }
            />
            {homes.map((h, i) => (
              <Radar
                key={h.id}
                name={h.id}
                dataKey={h.id}
                stroke={COLORS[i % COLORS.length]}
                fill={COLORS[i % COLORS.length]}
                fillOpacity={0.18}
                strokeWidth={2}
              />
            ))}
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
