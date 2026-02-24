export const CHART_TOOLTIP_STYLE = {
  background: 'rgba(10,13,22,0.95)',
  backdropFilter: 'blur(16px)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '12px',
  fontSize: '11px',
  color: '#ffffff',
  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
} as const;

/** Recharts itemStyle — styles each data row inside the tooltip */
export const CHART_TOOLTIP_ITEM_STYLE = {
  color: '#e2e8f0',
  fontSize: '11px',
} as const;

/** Recharts labelStyle — styles the tooltip header/label */
export const CHART_TOOLTIP_LABEL_STYLE = {
  color: 'rgba(255,255,255,0.5)',
  fontSize: '10px',
  marginBottom: '2px',
} as const;

export const CHART_COLORS = ['#4f8fff', '#a855f7', '#00e5a0', '#ffb224', '#ff4d6a', '#00d4aa', '#eab308', '#14b8a6'];
