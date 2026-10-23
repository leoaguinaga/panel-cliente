'use client';
import { Skeleton } from 'boneyard-js/react';
export function DemosFixture() {
  return <div className="space-y-6" aria-hidden="true"><div className="h-24 max-w-lg rounded bg-muted" /><div className="h-16 w-64 max-w-full rounded bg-muted" /><div className="space-y-4 rounded-xl border p-5">{[0, 1].map(item => <div key={item} className="h-32 rounded bg-muted" />)}</div><div className="grid gap-4 rounded-xl border p-5 sm:grid-cols-2">{Array.from({ length: 10 }, (_, index) => <div key={index} className="h-16 rounded bg-muted" />)}<div className="h-28 rounded bg-muted sm:col-span-2" /></div></div>;
}
export function DemosLoading() {
  return <div role="status" aria-label="Cargando demos"><Skeleton name="product-demos" loading fixture={<DemosFixture />} fallback={<DemosFixture />}><DemosFixture /></Skeleton></div>;
}
