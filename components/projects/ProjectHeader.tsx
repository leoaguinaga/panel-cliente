import Link from 'next/link';
import { ArrowLeft, FolderArchive } from 'lucide-react';
import type { ProjectSummary } from '@/src/modules/projects/types';

const initials = (name?: string) => name ? name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() : 'UN';

export function ProjectHeader({ project }: { project: ProjectSummary }) {
  const activeSprint = project.sprints[0];
  return <header className="space-y-4">
    <Link href="/internal/projects" className="inline-flex min-h-10 items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900"><ArrowLeft className="size-4" />Proyectos</Link>
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2.5"><h1 className="truncate text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{project.name}</h1><span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500"><FolderArchive className="size-3" />{project._count.tasks} tareas</span>{activeSprint && <span className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700">★ {activeSprint.name}</span>}</div>
        <p className="mt-1 text-xs text-slate-500"><span className="font-semibold text-slate-700">{project.client.businessName || project.client.name}</span> · Responsable: <b className="font-medium text-slate-800">{project.responsibleWorker?.name || 'Sin asignar'}</b></p>
      </div>
      <div className="flex items-center gap-3"><div aria-label={`Responsable ${project.responsibleWorker?.name || 'sin asignar'}`} className="flex size-10 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">{initials(project.responsibleWorker?.name)}</div><div className="border-l pl-3 text-right"><p className="text-[11px] font-medium text-slate-400">Progreso global</p><p className="text-sm font-bold text-slate-800">{project.progress}%</p></div></div>
    </div>
  </header>;
}
