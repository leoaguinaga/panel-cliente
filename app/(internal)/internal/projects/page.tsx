import Link from 'next/link';
import { getProjectsOverview } from '@/src/modules/projects/server/queries';
import { getClients } from '@/src/modules/leads/server/queries';
import { CreateProjectSheet } from '@/components/internal/CreateSheets';
import { formatProjectStatus } from '@/lib/formatters';

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  const { q, status } = await searchParams;
  const [projects, clients] = await Promise.all([getProjectsOverview({ search: q, status }), getClients()]);

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Operación</p>
          <h1 className="text-3xl font-semibold tracking-tight">Proyectos</h1>
          <p className="mt-1 text-sm text-muted-foreground">Seguimiento de trabajo, responsables y entregas de Foxcode.</p>
        </div>
        <CreateProjectSheet clients={clients} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Summary label="Activos" value={projects.filter((p) => p.status === 'IN_PROGRESS').length} />
        <Summary label="En planificación" value={projects.filter((p) => p.status === 'PLANNING').length} />
        <Summary label="Tareas registradas" value={projects.reduce((total, p) => total + p._count.tasks, 0)} />
      </div>

      <form className="flex flex-wrap gap-2"><input name="q" defaultValue={q} placeholder="Buscar proyecto o cliente" className="w-full max-w-sm rounded-md border bg-background px-3 py-2 text-sm" /><select name="status" defaultValue={status || ''} className="rounded-md border bg-background px-3 py-2 text-sm"><option value="">Todos los estados</option>{['PLANNING','IN_PROGRESS','PAUSED','DELIVERED','CANCELLED'].map((value) => <option key={value} value={value}>{formatProjectStatus(value)}</option>)}</select><button className="rounded-md border px-4 py-2 text-sm">Filtrar</button></form>

      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="border-b px-5 py-4"><h2 className="font-medium">Todos los proyectos</h2></div>
        {projects.length === 0 ? (
          <div className="px-5 py-16 text-center text-sm text-muted-foreground">Aún no hay proyectos registrados.</div>
        ) : (
          <div className="divide-y">
            {projects.map((project) => (
              <Link key={project.id} href={`/internal/projects/${project.id}`} className="block px-5 py-4 transition-colors hover:bg-muted/40">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div><h3 className="font-medium">{project.name}</h3><p className="text-sm text-muted-foreground">{project.client.businessName || project.client.name}</p></div>
                  <div className="flex items-center gap-3 text-sm"><span className="rounded-full bg-muted px-2.5 py-1 text-muted-foreground">{formatProjectStatus(project.status)}</span><span className="font-medium">{project.progress}%</span></div>
                </div>
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground"><span>{project.service?.name || project.product?.name || 'Sin línea asignada'}</span><span>{project._count.tasks} tareas</span><span>Responsable: {project.responsibleWorker?.name || 'Sin asignar'}</span></div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-foreground" style={{ width: `${Math.min(100, Math.max(0, project.progress))}%` }} /></div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function Summary({ label, value }: { label: string; value: number }) {
  return <div className="rounded-xl border bg-card p-4"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p></div>;
}
