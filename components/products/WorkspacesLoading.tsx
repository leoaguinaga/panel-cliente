'use client';
import { Skeleton } from 'boneyard-js/react';

/** Misma geometría que la lista de espacios: cabecera, botón y tres filas. */
function Fixture() {
  return (
    <div className="space-y-6" aria-hidden="true">
      <div className="flex flex-wrap items-end justify-between gap-4"><div className="space-y-2"><div className="h-8 w-40 rounded bg-muted" /><div className="h-4 w-96 max-w-full rounded bg-muted" /></div><div className="h-9 w-36 rounded-lg bg-muted" /></div>
      <div className="rounded-xl border bg-card">
        {[0, 1, 2].map((row) => (
          <div key={row} className="flex min-h-[76px] items-center gap-3 border-t px-4 first:border-t-0">
            <div className="size-[30px] shrink-0 rounded-lg bg-muted" />
            <div className="flex-1 space-y-1.5"><div className="h-4 w-32 rounded bg-muted" /><div className="h-3 w-56 max-w-full rounded bg-muted" /></div>
            <div className="hidden gap-8 sm:flex">{[0, 1, 2, 3].map((cell) => <div key={cell} className="h-5 w-12 rounded bg-muted" />)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function WorkspacesLoading() {
  return <div role="status" aria-label="Cargando espacios"><Skeleton name="product-workspaces" loading fixture={<Fixture />} fallback={<Fixture />}><Fixture /></Skeleton></div>;
}
