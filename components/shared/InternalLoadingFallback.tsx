'use client';

import { Skeleton } from 'boneyard-js/react';

function Shell() {
  return <div className="space-y-6"><div className="space-y-2"><div className="h-4 w-28 rounded bg-muted" /><div className="h-9 w-56 rounded bg-muted" /><div className="h-4 w-96 max-w-full rounded bg-muted" /></div><div className="grid gap-4 sm:grid-cols-3"><div className="h-28 rounded-xl bg-muted" /><div className="h-28 rounded-xl bg-muted" /><div className="h-28 rounded-xl bg-muted" /></div><div className="overflow-hidden rounded-xl border bg-card"><div className="h-14 border-b" /><div className="space-y-4 p-5">{Array.from({ length: 5 }, (_, index) => <div key={index} className="flex items-center justify-between gap-4"><div className="space-y-2"><div className="h-4 w-52 rounded bg-muted" /><div className="h-3 w-32 rounded bg-muted" /></div><div className="h-6 w-20 rounded-full bg-muted" /></div>)}</div></div></div>;
}

export function InternalLoadingFallback({ name = 'internal-route' }: { name?: string }) {
  return <Skeleton name={name} loading fixture={<Shell />} fallback={<Shell />}><Shell /></Skeleton>;
}
