import { useEffect, useRef } from 'react';
import { clsx } from 'clsx';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: 'danger' | 'default';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  variant = 'default',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0d16]/95 backdrop-blur-2xl animate-fade-in"
      onClick={(e) => {
        if (e.target === overlayRef.current) onCancel();
      }}
    >
      <div className="mx-4 w-full max-w-sm rounded-xl border border-white/[0.08] bg-[#0e1120]/95 backdrop-blur-2xl p-5 shadow-2xl">
        <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
        <p className="mt-2 text-xs text-text-muted">{message}</p>
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-xl border border-white/[0.08] px-3 py-1.5 text-xs text-text-muted hover:text-white hover:border-border-hover transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={clsx(
              'rounded-xl px-3 py-1.5 text-xs font-medium transition-colors',
              variant === 'danger'
                ? 'bg-error text-white hover:bg-error/80'
                : 'bg-primary text-white hover:bg-primary/80'
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
