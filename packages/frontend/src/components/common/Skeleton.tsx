import { clsx } from 'clsx';

export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx('animate-shimmer rounded bg-white/[0.06]', className)} />;
}

export function SkeletonAgentCard() {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-md p-4 space-y-3">
      <div className="flex items-start justify-between">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-4 rounded-full" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1"><Skeleton className="h-3 w-10" /><Skeleton className="h-3 w-16" /></div>
        <div className="space-y-1"><Skeleton className="h-3 w-10" /><Skeleton className="h-3 w-8" /></div>
        <div className="space-y-1"><Skeleton className="h-3 w-10" /><Skeleton className="h-3 w-8" /></div>
        <div className="space-y-1"><Skeleton className="h-3 w-10" /><Skeleton className="h-3 w-12" /></div>
      </div>
      <Skeleton className="h-8 w-full rounded-md" />
    </div>
  );
}

export function SkeletonAgentGrid() {
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <SkeletonAgentCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonAgentTable() {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-md overflow-hidden">
      <div className="border-b border-border-default px-4 py-3 flex gap-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-3 w-20" />
        ))}
      </div>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="border-b border-white/5 px-4 py-3 flex gap-8">
          {Array.from({ length: 6 }).map((_, j) => (
            <Skeleton key={j} className="h-3 w-24" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonMetrics() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-md p-4 space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-md p-4">
            <Skeleton className="h-4 w-32 mb-4" />
            <Skeleton className="h-48 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonTopology() {
  return (
    <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
      <div className="text-center space-y-3">
        <Skeleton className="mx-auto h-8 w-8 rounded-full" />
        <Skeleton className="mx-auto h-3 w-32" />
      </div>
    </div>
  );
}
