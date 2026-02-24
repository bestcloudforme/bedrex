import { useEffect } from 'react';
import { Link } from 'react-router-dom';

export function NotFoundPage() {
  useEffect(() => {
    document.title = 'Not Found | BedRex';
  }, []);

  return (
    <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
      <div className="text-center bg-white/[0.04] backdrop-blur-md border border-white/[0.08] rounded-xl p-10">
        <p className="text-6xl font-bold text-text-faint">404</p>
        <p className="mt-3 text-lg text-text-muted">Page not found</p>
        <p className="mt-1 text-sm text-text-faint">The page you're looking for doesn't exist.</p>
        <Link
          to="/agents"
          className="mt-6 inline-block rounded-xl bg-primary px-4 py-2 text-sm text-white hover:bg-primary/80 transition-colors duration-200"
        >
          Go to Agents
        </Link>
      </div>
    </div>
  );
}
