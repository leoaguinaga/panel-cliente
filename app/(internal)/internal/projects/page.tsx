import { getProjectFacets, getProjectsPage } from '@/src/modules/projects/server/queries';
import { getClients, getWorkers } from '@/src/modules/leads/server/queries';
import { getCatalogs } from '@/src/modules/products/server/queries';
import { CreateProjectSheet } from '@/components/internal/CreateSheets';
import { FilterBar, type FilterDef } from '@/components/internal/FilterBar';
import { DUE_OPTIONS, namedOptions, withCounts, workerOptions } from '@/components/internal/filter-options';
import { Pagination } from '@/components/shared/Pagination';
import { ProjectRow } from '@/components/internal/ProjectRow';
import { PROJECT_COLUMNS } from '@/components/internal/project-columns';
import { formatProjectStatus } from '@/lib/formatters';
import { cn } from '@/lib/utils';

const PROJECT_STATUSES = ['PLANNING', 'IN_PROGRESS', 'PAUSED', 'DELIVERED', 'CANCELLED'];
const DEFAULT_VIEW = 'active';

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
        <div aria-hidden className="hidden border-b bg-card py-2.5 pr-5 pl-11 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground @3xl:block">
          <div className={cn('grid gap-4', PROJECT_COLUMNS)}>
            <span>Proyecto</span><span>Estado</span><span>Responsable</span><span>Avance</span><span>Tareas</span>
          </div>
        </div>
        {!data.items.length && <p className="p-5 text-sm text-muted-foreground">No hay proyectos con estos filtros.</p>}
        <ul className="divide-y">
          {data.items.map((project) => <ProjectRow key={project.id} project={project} />)}
        </ul>
      </div>
      <Pagination total={data.total} page={data.page} query={query} />
    </section>
  );
}
