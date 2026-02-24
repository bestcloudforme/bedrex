import { useId } from 'react';
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import type { MetricDataPoint } from '@bedrex/shared';
import { CHART_TOOLTIP_STYLE, CHART_TOOLTIP_ITEM_STYLE, CHART_TOOLTIP_LABEL_STYLE } from '../../utils/chart-styles';

interface SparklineChartProps {
  data: MetricDataPoint[];
  color: string;
  height?: number;
}

export function SparklineChart({ data, color, height = 60 }: SparklineChartProps) {
  const uid = useId().replace(/:/g, '');
  const gradientId = `gradient-${color.replace('#', '')}-${uid}`;

  if (data.length === 0) return <div className="flex items-center justify-center h-[60px] text-xs text-text-faint">No data</div>;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="timestamp" hide />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={1.5}
          fill={`url(#${gradientId})`}
        />
        <Tooltip
          contentStyle={CHART_TOOLTIP_STYLE}
          itemStyle={CHART_TOOLTIP_ITEM_STYLE}
          labelStyle={CHART_TOOLTIP_LABEL_STYLE}
          labelFormatter={(_, payload) => {
            if (payload && payload[0]) {
              return new Date(payload[0].payload.timestamp).toLocaleTimeString();
            }
            return '';
          }}
          formatter={(value: number) => [value.toFixed(1), '']}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
