'use client';
import { Skeleton } from 'boneyard-js/react';
function Fixture({ detail = false }: { detail?: boolean }) {
  return <div aria-hidden className="space-y-7"><div className="flex justify-between gap-4"><div className="h-10 w-44 rounded bg-muted" /><div className="h-10 w-32 rounded bg-muted" /></div><div className={detail ? 'grid gap-6 xl:grid-cols-[minmax(0,1fr)_19rem]' : 'space-y-5'}><div className="space-y-5">{!detail && <div className="h-24 rounded-xl bg-muted" />}<div className="space-y-1 overflow-hidden rounded-xl">{[0, 1, 2].map(row => <div key={row} className="h-24 bg-muted" />)}</div></div>{detail && <div className="h-96 rounded-xl bg-muted" />}</div></div>;
}
export function ClientsLoading({ detail = false }: { detail?: boolean }) {
  const fixture = <Fixture detail={detail} />;
  return <div role="status" aria-label="Cargando clientes"><Skeleton name={detail ? 'internal-client-detail' : 'internal-clients'} loading fixture={fixture} fallback={fixture} select="viewport">{fixture}</Skeleton></div>;
}
