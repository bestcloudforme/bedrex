import { clsx } from 'clsx';

interface CheckboxProps {
  checked: boolean;
  onChange: () => void;
  className?: string;
}

export function Checkbox({ checked, onChange, className }: CheckboxProps) {
  return (
    <button
      role="checkbox"
      aria-checked={checked}
      onClick={onChange}
      className={clsx(
        'h-3.5 w-3.5 rounded border flex items-center justify-center transition-colors shrink-0 focus-visible:ring-2 focus-visible:ring-primary/50',
        checked
          ? 'border-primary bg-primary'
          : 'border-white/[0.14] bg-transparent hover:border-white/[0.25]',
        className
      )}
    >
      {checked && (
        <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={2.5}>
          <path d="M2 6l3 3 5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}
