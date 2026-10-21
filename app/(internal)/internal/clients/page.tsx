import Link from 'next/link';
import { ArrowRight, Search, Users } from 'lucide-react';
import { getClientsPage } from '@/src/modules/clients/server/queries';
import { getWorkers } from '@/src/modules/leads/server/queries';
import { CreateClientSheet } from '@/components/internal/CreateSheets';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ClientLogo } from '@/components/shared/ClientLogo';
import { Pagination } from '@/components/shared/Pagination';
import { formatClientStatus } from '@/lib/formatters';

const input = 'min-h-11 w-full rounded-lg border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';
export default async function ClientsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const query = await searchParams;
  const [{ items: clients, total, page }, workers] = await Promise.all([getClientsPage(query), getWorkers()]);
  const filtered = Boolean(query.q || query.status || query.workerId);
  return <section className="space-y-7">
    <header className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-3xl font-semibold">Clientes</h1><p className="mt-2 text-sm text-muted-foreground">Contactos, empresas y proyectos en un solo lugar.</p></div><CreateClientSheet /></header>
    <div className="space-y-5">
      <form className="grid items-end gap-3 rounded-xl border bg-card p-4 sm:grid-cols-2 xl:grid-cols-[minmax(16rem,1fr)_12rem_13rem_auto]">
        <label className="text-xs font-medium">Buscar cliente<div className="relative mt-2"><Search aria-hidden className="absolute left-3 top-3.5 size-4 text-muted-foreground" /><input name="q" defaultValue={query.q} placeholder="Nombre, empresa, correo o documento" className={`${input} pl-9`} /></div></label>
        <label className="text-xs font-medium">Estado<select name="status" defaultValue={query.status || ''} className={`mt-2 ${input}`}><option value="">Todos los vigentes</option>{['PROSPECT', 'ACTIVE', 'INACTIVE', 'ARCHIVED'].map(status => <option key={status} value={status}>{formatClientStatus(status)}</option>)}</select></label>
        <label className="text-xs font-medium">Responsable<select name="workerId" defaultValue={query.workerId || ''} className={`mt-2 ${input}`}><option value="">Todos</option><option value="unassigned">Sin responsable</option>{workers.map(worker => <option key={worker.id} value={worker.id}>{worker.name}</option>)}</select></label>
        <button className={`${input} w-auto px-5 font-medium hover:bg-muted`}>Aplicar filtros</button>
      </form>
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm"><div className="flex items-center gap-3"><p><span className="font-semibold tabular-nums">{total}</span> {total === 1 ? 'cliente' : 'clientes'}{filtered ? ' encontrados' : ''}</p>{filtered && <Link href="/internal/clients" className="text-muted-foreground underline underline-offset-4">Limpiar filtros</Link>}</div></div>
      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="hidden grid-cols-[minmax(0,2fr)_minmax(0,1fr)_7rem_7rem_1rem] gap-5 border-b bg-muted/30 px-5 py-3 text-xs font-medium text-muted-foreground lg:grid"><span>Cliente / contacto</span><span>Responsable</span><span>Estado</span><span>Proyectos</span><span /></div>
        {!clients.length && <div className="flex flex-col items-center px-6 py-16 text-center"><Users className="mb-4 size-8 text-muted-foreground" /><h2 className="font-semibold">{filtered ? 'Sin coincidencias' : 'Tu cartera de clientes empieza aquí'}</h2><p className="mb-5 mt-2 max-w-sm text-sm text-muted-foreground">{filtered ? 'Prueba con otro nombre o ajusta el estado y el responsable.' : 'Registra tu primer contacto para reunir sus proyectos y documentos.'}</p>{filtered ? <Link href="/internal/clients" className="underline underline-offset-4">Ver todos los clientes</Link> : <CreateClientSheet />}</div>}
        <div className="divide-y">{clients.map(client => <Link key={client.id} href={`/internal/clients/${client.id}`} className="group grid items-center gap-4 px-5 py-5 transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_7rem_7rem_1rem]">
          <div className="flex min-w-0 items-center gap-3"><ClientLogo client={client} /><div className="min-w-0"><h2 className="break-words font-semibold">{client.businessName || client.name}</h2><p className="mt-1 break-all text-sm text-muted-foreground">{client.email || client.name}</p></div></div>
          <span className="text-sm text-muted-foreground"><span className="lg:hidden">Responsable: </span>{client.responsibleWorker?.name || 'Sin asignar'}</span><div><StatusBadge status={client.status} /></div><span className="text-sm tabular-nums text-muted-foreground">{client._count.projects} <span className="lg:sr-only">{client._count.projects === 1 ? 'proyecto' : 'proyectos'}</span></span><ArrowRight aria-hidden className="hidden size-4 text-muted-foreground group-hover:text-foreground lg:block" />
        </Link>)}</div>
      </div>
      <Pagination total={total} page={page} query={query} />
    </div>
  </section>;
}
