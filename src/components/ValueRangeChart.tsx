import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Cell,
  ResponsiveContainer,
  ReferenceArea
} from 'recharts';
import { Home } from '../data/homes';
import { Card } from './ui/Card';
import { fmtEURk } from '../lib/finance';

interface Props {
  home: Home;
  bid: number;
}

export function ValueRangeChart({ home, bid }: Props) {
  const data: Array<{ name: string; value: number; kind: string }> = [];
  if (home.woz) {
    data.push(
      { name: 'WOZ \'23', value: home.woz['2023'], kind: 'woz' },
      { name: 'WOZ \'24', value: home.woz['2024'], kind: 'woz' },
      { name: 'WOZ \'25', value: home.woz['2025'], kind: 'woz' }
    );
  }
  data.push(
    { name: 'Vraagprijs', value: home.askPrice, kind: 'ask' },
    { name: 'Jouw bod', value: bid, kind: 'bid' }
  );

  const allValues = [
    ...data.map((d) => d.value),
    ...(home.huispedia ? [home.huispedia.p40, home.huispedia.p80] : [])
  ];
  const min = Math.floor((Math.min(...allValues) - 20_000) / 10_000) * 10_000;
  const max = Math.ceil((Math.max(...allValues) + 20_000) / 10_000) * 10_000;

  const colorFor = (kind: string) => {
    if (kind === 'bid') return '#6ee7b7';
    if (kind === 'ask') return '#fbbf24';
    return '#64748b';
  };

  return (
    <Card
      title={`Waarderingen — ${home.address}`}
      subtitle={
        !home.woz && !home.huispedia
          ? 'WOZ + Huispedia ontbreken — alleen vraag + bod zichtbaar'
          : 'WOZ-historie + Huispedia 40/60/80% band + vraagprijs + jouw bod'
      }
    >
      <div className="h-72 w-full">
        <ResponsiveContainer>
          <ComposedChart
            data={data}
            margin={{ top: 10, right: 30, bottom: 10, left: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#252b34" />
            <XAxis dataKey="name" stroke="#7b8794" fontSize={11} />
            <YAxis
              domain={[min, max]}
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
              labelStyle={{ color: '#e6edf3' }}
              formatter={(v: number) => fmtEURk(v)}
            />

            {home.huispedia && (
              <>
                <ReferenceArea
                  y1={home.huispedia.p40}
                  y2={home.huispedia.p80}
                  fill="#6ee7b7"
                  fillOpacity={0.08}
                  stroke="#6ee7b7"
                  strokeOpacity={0.2}
                  ifOverflow="extendDomain"
                />
                <ReferenceLine
                  y={home.huispedia.p40}
                  stroke="#6ee7b7"
                  strokeDasharray="2 4"
                  label={{
                    value: `p40 ${fmtEURk(home.huispedia.p40)}`,
                    fill: '#6ee7b7',
                    fontSize: 10,
                    position: 'insideTopRight'
                  }}
                />
                <ReferenceLine
                  y={home.huispedia.p60}
                  stroke="#6ee7b7"
                  strokeDasharray="4 2"
                  label={{
                    value: `p60 ${fmtEURk(home.huispedia.p60)}`,
                    fill: '#6ee7b7',
                    fontSize: 10,
                    position: 'insideTopRight'
                  }}
                />
                <ReferenceLine
                  y={home.huispedia.p80}
                  stroke="#6ee7b7"
                  strokeDasharray="2 4"
                  label={{
                    value: `p80 ${fmtEURk(home.huispedia.p80)}`,
                    fill: '#6ee7b7',
                    fontSize: 10,
                    position: 'insideTopRight'
                  }}
                />
              </>
            )}

            <Bar dataKey="value" barSize={32} radius={[4, 4, 0, 0]}>
              {data.map((d, i) => (
                <Cell key={i} fill={colorFor(d.kind)} />
              ))}
            </Bar>
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted">
        <Legend color="#64748b" label="WOZ" />
        <Legend color="#fbbf24" label="Vraagprijs" />
        <Legend color="#6ee7b7" label="Jouw bod / Huispedia band" />
      </div>
    </Card>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className="inline-block h-2.5 w-2.5 rounded-sm"
        style={{ background: color }}
      />
      {label}
    </div>
  );
}
