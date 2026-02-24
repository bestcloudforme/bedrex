import { useState, useRef, useEffect } from 'react';
import { clsx } from 'clsx';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  className?: string;
}

export function Select({ value, onChange, options, className }: SelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selectedLabel = options.find((o) => o.value === value)?.label || value;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={ref} className={clsx('relative', className)}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-sm px-3 py-1.5 text-xs text-text-muted hover:border-border-hover hover:text-text-secondary transition-all focus-visible:ring-2 focus-visible:ring-primary/50"
      >
        <span>{selectedLabel}</span>
        <svg
          className={clsx('h-3 w-3 transition-transform', open && 'rotate-180')}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 min-w-[160px] rounded-xl border border-white/[0.08] bg-[#0e1120]/95 backdrop-blur-xl py-1 shadow-[0_8px_32px_rgba(0,0,0,0.4)] animate-slide-down">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={clsx(
                'w-full px-3 py-1.5 text-left text-xs transition-colors',
                opt.value === value
                  ? 'bg-primary/20 text-primary'
                  : 'text-text-muted hover:bg-white/5 hover:text-text-secondary',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
