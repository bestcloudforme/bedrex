import { clsx } from 'clsx';
import type { TimeRange } from '@bedrex/shared';

const ranges: { value: TimeRange; label: string }[] = [
  { value: '1h', label: '1H' },
  { value: '6h', label: '6H' },
  { value: '24h', label: '24H' },
  { value: '7d', label: '7D' },
  { value: '30d', label: '30D' },
];

interface TimeRangeSelectorProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
}

export function TimeRangeSelector({ value, onChange }: TimeRangeSelectorProps) {
  return (
    <div className="flex rounded-xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-sm overflow-hidden">
      {ranges.map((r) => (
        <button
          key={r.value}
          onClick={() => onChange(r.value)}
          className={clsx(
            'px-3 py-1.5 text-xs font-medium transition-colors',
            value === r.value ? 'bg-white/[0.08] text-white' : 'text-text-muted hover:text-white hover:bg-white/5'
          )}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}
