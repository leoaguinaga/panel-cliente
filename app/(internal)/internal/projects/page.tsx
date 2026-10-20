import Link from 'next/link';
import { getProjectFacets, getProjectsPage, listParams } from '@/src/modules/projects/server/queries';
import { getClients, getWorkers } from '@/src/modules/leads/server/queries';
import { getCatalogs } from '@/src/modules/products/server/queries';
import { CreateProjectSheet } from '@/components/internal/CreateSheets';
import { FilterBar, type FilterDef } from '@/components/internal/FilterBar';
import { DUE_OPTIONS, namedOptions, withCounts, workerOptions } from '@/components/internal/filter-options';
import { Pagination } from '@/components/shared/Pagination';
import { formatDate, formatProjectStatus } from '@/lib/formatters';
import { cn } from '@/lib/utils';

const PROJECT_STATUSES = ['PLANNING', 'IN_PROGRESS', 'PAUSED', 'DELIVERED', 'CANCELLED'];
const DEFAULT_VIEW = 'active';
const STATUS_DOT: Record<string, string> = {
  PLANNING: 'bg-muted-foreground',
  IN_PROGRESS: 'bg-sky-400',
  PAUSED: 'bg-amber-400',
  DELIVERED: 'bg-emerald-400',
  CANCELLED: 'bg-rose-400',
};

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const query = await searchParams;
  const view = query.view || DEFAULT_VIEW;
  const effective = { ...query, view };
  const [data, facets, clients, workers, catalogs] = await Promise.all([
    getProjectsPage(effective),
    getProjectFacets(effective),
    getClients(),
    getWorkers(),
    getCatalogs(),
  ]);
  const filters: FilterDef[] = [
    ...(view === 'all' ? [{ key: 'status', label: 'Estado', options: withCounts(PROJECT_STATUSES.map((status) => ({ value: status, label: formatProjectStatus(status) })), facets.status) }] : []),
    { key: 'workerId', label: 'Responsable', options: withCounts(workerOptions(workers), facets.worker) },
    { key: 'due', label: 'Entrega', single: true, options: DUE_OPTIONS },
    { key: 'productId', label: 'Producto', secondary: true, options: withCounts(namedOptions(catalogs.products), facets.product) },
    { key: 'serviceId', label: 'Servicio', secondary: true, options: withCounts(namedOptions(catalogs.services), facets.service) },
  ];
  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold">Proyectos</h1>
        <div className="flex flex-wrap gap-2">
          <a href={`/api/backend/projects/export?${listParams(effective, { keepPage: false })}`} className="inline-flex h-9 items-center rounded-lg border bg-card px-3 text-sm font-semibold hover:bg-muted">
            Exportar CSV
          </a>
          <CreateProjectSheet clients={clients} />
        </div>
      </header>
      <FilterBar
        defaultView={DEFAULT_VIEW}
        views={[
          { id: 'active', label: 'Activos', count: facets.views.active },
          { id: 'paused', label: 'En pausa', count: facets.views.paused },
          { id: 'delivered', label: 'Entregados', count: facets.views.delivered },
          { id: 'all', label: 'Todos', count: facets.views.all },
        ]}
        filters={filters}
        searchPlaceholder="Buscar proyecto o cliente…"
      />
      <div className="@container overflow-hidden rounded-xl border">
        <div aria-hidden className="hidden grid-cols-[minmax(0,2fr)_9.5rem_9rem_7rem_8.5rem] gap-4 border-b bg-card px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground @3xl:grid">
          <span>Proyecto</span><span>Estado</span><span>Responsable</span><span>Avance</span><span>Tareas</span>
        </div>
        {!data.items.length && <p className="p-5 text-sm text-muted-foreground">No hay proyectos con estos filtros.</p>}
        <ul className="divide-y">
          {data.items.map((project) => (
            <li key={project.id}>
              <Link
                href={`/internal/projects/${project.id}`}
                className="grid grid-cols-2 items-center gap-x-4 gap-y-3 px-5 py-4 text-sm transition-colors hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-none @3xl:grid-cols-[minmax(0,2fr)_9.5rem_9rem_7rem_8.5rem]"
              >
                <span className="col-span-2 min-w-0 @3xl:col-span-1">
                  <span className="block truncate font-semibold">{project.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {project.client.businessName || project.client.name} · {project.estimatedEndDate ? `entrega ${formatDate(project.estimatedEndDate)}` : 'sin fecha de entrega'}
                  </span>
                </span>
                <span className="inline-flex items-center gap-2 whitespace-nowrap font-medium">
                  <span aria-hidden className={cn('size-2 rounded-full', STATUS_DOT[project.status] ?? 'bg-muted-foreground')} />
                  {formatProjectStatus(project.status)}
                </span>
                <span className={cn('truncate', !project.responsibleWorker && 'text-amber-400')}>{project.responsibleWorker?.name || 'Sin responsable'}</span>
                <span>
                  <span className="block h-1.5 overflow-hidden rounded-full bg-muted">
                    <span className="block h-full rounded-full bg-primary" style={{ width: `${project.progress}%` }} />
                  </span>
                  <span className="mt-1 block text-xs tabular-nums text-muted-foreground">{project.progress}%</span>
                </span>
                <span className="text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">{project.taskStats.open}</span> abiertas
                  {project.taskStats.blocked > 0 && <span className="font-semibold text-rose-400"> · {project.taskStats.blocked} bloq.</span>}
                  {project.taskStats.overdue > 0 && <span className="font-semibold text-rose-400"> · {project.taskStats.overdue} vencidas</span>}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <Pagination total={data.total} page={data.page} query={query} />
    </section>
  );
}
