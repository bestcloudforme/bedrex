import { Handle, Position } from '@xyflow/react';
import { clsx } from 'clsx';

interface BaseNodeProps {
  label: string;
  icon: React.ReactNode;
  color: string;
  borderColor: string;
  selected?: boolean;
  subtitle?: string;
  direction?: 'TB' | 'LR';
  badge?: string;
}

export function BaseNode({ label, icon, color, borderColor, selected, subtitle, badge }: BaseNodeProps) {
  return (
    <div
      className={clsx(
        'rounded-xl border-2 px-3 py-2 shadow-lg min-w-[160px] max-w-[240px] backdrop-blur-sm hover:scale-[1.02] transition-all duration-200',
        selected ? 'ring-2 ring-white/50 scale-105' : '',
      )}
      style={{
        backgroundColor: `${color}15`,
        borderColor,
        boxShadow: selected ? `0 0 20px ${borderColor}40, 0 0 40px ${borderColor}20` : undefined,
      }}
    >
      {/* Target handles on all 4 sides */}
      <Handle type="target" position={Position.Top} id="t-top" className="!w-0 !h-0 !bg-transparent !border-0 !min-w-0 !min-h-0" />
      <Handle type="target" position={Position.Right} id="t-right" className="!w-0 !h-0 !bg-transparent !border-0 !min-w-0 !min-h-0" />
      <Handle type="target" position={Position.Bottom} id="t-bottom" className="!w-0 !h-0 !bg-transparent !border-0 !min-w-0 !min-h-0" />
      <Handle type="target" position={Position.Left} id="t-left" className="!w-0 !h-0 !bg-transparent !border-0 !min-w-0 !min-h-0" />

      <div className="flex items-center gap-2">
        <div className="shrink-0 text-lg" style={{ color: borderColor }}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-text-primary">{label}</p>
          {subtitle && <p className="truncate text-xs text-text-muted">{subtitle}</p>}
          {badge && (
            <span className="text-[10px] text-text-faint bg-white/[0.06] rounded px-1.5 py-0.5 mt-1 inline-block font-mono">
              {badge}
            </span>
          )}
        </div>
      </div>

      {/* Source handles on all 4 sides */}
      <Handle type="source" position={Position.Top} id="s-top" className="!w-0 !h-0 !bg-transparent !border-0 !min-w-0 !min-h-0" />
      <Handle type="source" position={Position.Right} id="s-right" className="!w-0 !h-0 !bg-transparent !border-0 !min-w-0 !min-h-0" />
      <Handle type="source" position={Position.Bottom} id="s-bottom" className="!w-0 !h-0 !bg-transparent !border-0 !min-w-0 !min-h-0" />
      <Handle type="source" position={Position.Left} id="s-left" className="!w-0 !h-0 !bg-transparent !border-0 !min-w-0 !min-h-0" />
    </div>
  );
}
