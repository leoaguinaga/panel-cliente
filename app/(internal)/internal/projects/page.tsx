import Link from 'next/link';
import { getProjectsPage } from '@/src/modules/projects/server/queries';
import { getClients, getWorkers } from '@/src/modules/leads/server/queries';
import { getCatalogs } from '@/src/modules/products/server/queries';
import { CreateProjectSheet } from '@/components/internal/CreateSheets';
import { WorkFilters } from '@/components/internal/WorkFilters';
import { Pagination } from '@/components/shared/Pagination';
import { formatProjectStatus } from '@/lib/formatters';
export default async function ProjectsPage({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}) {
 const query=await searchParams; const [data,clients,workers,catalogs]=await Promise.all([getProjectsPage(query),getClients(),getWorkers(),getCatalogs()]); const params=new URLSearchParams();for(const [key,value] of Object.entries(query)) if(value && key!=='page')params.set(key,value);
 return <section className="space-y-6"><header className="flex flex-wrap items-center justify-between gap-4"><h1 className="text-3xl font-semibold">Proyectos</h1><CreateProjectSheet clients={clients}/></header><WorkFilters query={query} workers={workers} products={catalogs.products} services={catalogs.services}/><div className="flex flex-wrap gap-4 text-sm"><a href={`/api/backend/projects/export?${params}`} className="underline">Exportar CSV</a><Link href="/internal/tasks" className="underline">Ver tareas del equipo</Link></div><div className="divide-y rounded-xl border">{!data.items.length && <p className="p-5 text-sm text-muted-foreground">No hay proyectos con estos filtros.</p>}{data.items.map(project=><Link key={project.id} href={`/internal/projects/${project.id}`} className="block space-y-2 p-5 hover:bg-muted/40"><div className="flex flex-wrap justify-between gap-3"><h2 className="font-medium">{project.name}</h2><span className="text-sm">{formatProjectStatus(project.status)} · {project.progress}%</span></div><p className="text-sm text-muted-foreground">{project.client.businessName||project.client.name} · {project.responsibleWorker?.name||'Sin responsable'} · {project._count.tasks} tareas</p><progress aria-label={`Avance de ${project.name}`} value={project.progress} max={100} className="h-2 w-full accent-foreground"/></Link>)}</div><Pagination total={data.total} page={data.page} query={query}/></section>;
}
