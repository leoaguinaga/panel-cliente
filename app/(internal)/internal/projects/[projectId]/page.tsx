import Link from 'next/link';
import { CalendarRange, ClipboardList, FileText, Kanban, Target } from 'lucide-react';
import { getProjectSite, getProjectSummary } from '@/src/modules/projects/server/queries';
import { ProjectSiteManager } from '@/components/projects/ProjectSiteManager';
import { ScopeColumns, hasScope } from '@/components/projects/ScopeColumns';
import { formatProjectPrice, formatProjectPriority, formatProjectStatus, formatProjectType } from '@/lib/formatters';

export default async function ProjectSummaryPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const [project, site] = await Promise.all([getProjectSummary(projectId), getProjectSite(projectId)]);
  const base = `/internal/projects/${projectId}`;
  const cards = [
    { href: `${base}/tasks/kanban`, label: 'Tareas', value: project._count.tasks, icon: Kanban },
    ...(project.usesSprints ? [{ href: `${base}/tasks/sprints`, label: 'Sprints', value: project._count.sprints, icon: CalendarRange }] : []),
    { href: `${base}/planning/requirements`, label: 'Requerimientos', value: project._count.requirements, icon: ClipboardList },
    { href: `${base}/planning/milestones`, label: 'Hitos', value: project._count.milestones, icon: Target },
    { href: `${base}/documentation/files`, label: 'Documentos', value: project._count.documents, icon: FileText },
  ];
  return <section aria-labelledby="summary-title" className="space-y-5">
    <div><h2 id="summary-title" className="text-base font-bold text-slate-900">Resumen operativo</h2><p className="mt-1 text-sm text-slate-500">Estado actual y accesos rápidos del proyecto.</p></div>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{cards.map(({ href, label, value, icon: Icon }) => <Link key={href} href={href} className="group rounded-2xl border bg-card p-4 shadow-xs transition-colors hover:border-blue-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"><div className="flex items-center justify-between"><Icon className="size-4 text-slate-400 group-hover:text-blue-600" /><span className="text-2xl font-bold text-slate-900">{value}</span></div><p className="mt-4 text-xs font-semibold text-slate-600">{label}</p></Link>)}</div>
    <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]"><article className="rounded-2xl border bg-card p-5"><h3 className="text-sm font-bold text-slate-900">Descripción</h3><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{project.description || 'Este proyecto todavía no tiene una descripción operativa.'}</p></article><aside className="rounded-2xl border bg-card p-5"><h3 className="text-sm font-bold text-slate-900">Datos principales</h3><dl className="mt-3 space-y-2 text-xs"><div className="flex justify-between gap-4"><dt className="text-slate-500">Estado</dt><dd className="font-semibold text-slate-800">{formatProjectStatus(project.status)}</dd></div><div className="flex justify-between gap-4"><dt className="text-slate-500">Prioridad</dt><dd className="font-semibold text-slate-800">{formatProjectPriority(project.priority)}</dd></div><div className="flex justify-between gap-4"><dt className="text-slate-500">Servicio</dt><dd className="font-semibold text-slate-800">{project.service?.name || formatProjectType(project.type)}</dd></div><div className="flex justify-between gap-4"><dt className="text-slate-500">Precio</dt><dd className="font-semibold text-slate-800">{formatProjectPrice(project.price)}</dd></div></dl></aside></div>
    <ProjectSiteManager key={site?.url ?? 'none'} projectId={projectId} projectStatus={project.status} site={site} />
    <article aria-labelledby="scope-card-title" className="rounded-2xl border bg-card p-5"><div className="flex items-baseline justify-between gap-3"><h3 id="scope-card-title" className="text-sm font-bold text-slate-900">Alcance</h3><Link href={`${base}/planning/scope`} className="text-xs font-semibold text-slate-600 hover:text-slate-900">{hasScope(project.scope) ? 'Editar' : 'Definir alcance'}</Link></div>{hasScope(project.scope) ? <div className="mt-4"><ScopeColumns scope={project.scope} /></div> : <p className="mt-2 text-sm text-slate-600">Todavía no se definió qué incluye y qué no incluye el proyecto.</p>}</article>
  </section>;
}
