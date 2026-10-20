import Link from 'next/link';
import { getTasksPage } from '@/src/modules/projects/server/queries';
import { getWorkers } from '@/src/modules/leads/server/queries';
import { getCatalogs } from '@/src/modules/products/server/queries';
import { WorkFilters } from '@/components/internal/WorkFilters';
import { Pagination } from '@/components/shared/Pagination';
import { formatDate, formatTaskStatus } from '@/lib/formatters';
export default async function TasksPage({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}) {
 const query=await searchParams; const [data,workers,catalogs]=await Promise.all([getTasksPage(query),getWorkers(),getCatalogs()]);
 return <section className="space-y-6"><header><h1 className="text-3xl font-semibold">Tareas del equipo</h1><p className="mt-2 text-muted-foreground">Encuentra trabajo pendiente y abre el proyecto para resolverlo.</p></header><WorkFilters tasks query={query} workers={workers} products={catalogs.products} services={catalogs.services}/><ul className="divide-y rounded-xl border">{!data.items.length && <li className="p-5 text-sm text-muted-foreground">No hay tareas con estos filtros.</li>}{data.items.map(task=><li key={task.id} className="p-5"><Link className="font-medium underline" href={`/internal/projects/${task.project.id}/tasks/kanban?task=${task.id}`}>{task.title}</Link><p className="mt-2 text-sm text-muted-foreground">{task.project.name} · {task.assignedTo?.name||'Sin responsable'} · {formatTaskStatus(task.status)} · {task.dueDate ? `Vence ${formatDate(task.dueDate)}` : 'Sin fecha límite'}</p></li>)}</ul><Pagination total={data.total} page={data.page} query={query}/></section>;
}
