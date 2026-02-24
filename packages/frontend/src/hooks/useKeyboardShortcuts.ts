import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const CHORD_TIMEOUT = 1000;

const NAV_SHORTCUTS: Record<string, string> = {
  a: '/agents',
  t: '/topology',
  m: '/metrics',
  s: '/settings',
};

export function useKeyboardShortcuts() {
  const navigate = useNavigate();
  const pendingChordRef = useRef<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ignore when typing in input fields
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if ((e.target as HTMLElement)?.isContentEditable) return;

      const key = e.key.toLowerCase();

      if (pendingChordRef.current === 'g') {
        pendingChordRef.current = null;
        clearTimeout(timeoutRef.current);

        const path = NAV_SHORTCUTS[key];
        if (path) {
          e.preventDefault();
          navigate(path);
        }
        return;
      }

      if (key === 'g') {
        pendingChordRef.current = 'g';
        clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          pendingChordRef.current = null;
        }, CHORD_TIMEOUT);
        return;
      }
    };

    window.addEventListener('keydown', handler);
    return () => {
      window.removeEventListener('keydown', handler);
      clearTimeout(timeoutRef.current);
    };
  }, [navigate]);
}
