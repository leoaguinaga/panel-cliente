'use client';

import { useId, useState } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { PROJECT_COLUMNS } from '@/components/internal/project-columns';
import { ProjectMark } from '@/components/products/WorkspaceMark';
import { formatDate, formatProjectStatus } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import type { ProjectListItem } from '@/src/modules/projects/server/queries';


const STATUS_DOT: Record<string, string> = {
  PLANNING: 'bg-muted-foreground',
  IN_PROGRESS: 'bg-sky-400',
  PAUSED: 'bg-amber-400',
  DELIVERED: 'bg-emerald-400',
  CANCELLED: 'bg-rose-400',
};

const MILESTONE_STATUS: Record<string, { label: string; dot: string }> = {
  PENDING: { label: 'Pendiente', dot: 'bg-muted-foreground/60' },
  IN_PROGRESS: { label: 'En curso', dot: 'bg-sky-400' },
  IN_REVIEW: { label: 'En revisión', dot: 'bg-violet-400' },
  APPROVED: { label: 'Aprobado', dot: 'bg-emerald-400' },
  COMPLETED: { label: 'Aprobado', dot: 'bg-emerald-400' },
  BLOCKED: { label: 'Pendiente', dot: 'bg-muted-foreground/60' },
};

const isDone = (status: string) => status === 'APPROVED' || status === 'COMPLETED';

/** Fila de proyecto; si tiene hitos, se despliegan debajo sin salir del listado. */
export function ProjectRow({ project }: { project: ProjectListItem }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const milestones = project.milestones;
  const approved = milestones.filter((milestone) => isDone(milestone.status)).length;
  const href = `/internal/projects/${project.id}`;

  return (
    <li>
      <div className="flex items-stretch transition-colors hover:bg-muted/40 has-[a:focus-visible]:bg-muted/40">
        <div className="flex w-11 shrink-0 items-start justify-center pt-5 pl-2 @3xl:items-center @3xl:pt-0">
          {milestones.length > 0 && (
            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              aria-expanded={open}
              aria-controls={panelId}
              aria-label={`${open ? 'Ocultar' : 'Ver'} los ${milestones.length} hitos de ${project.name}`}
              className="grid size-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ChevronRight className={cn('size-4 transition-transform duration-200 ease-out motion-reduce:transition-none', open && 'rotate-90')} />
            </button>
          )}
        </div>
        <Link href={href} className={cn('grid min-w-0 flex-1 grid-cols-2 items-center gap-x-4 gap-y-3 py-4 pr-5 text-sm focus-visible:outline-none', PROJECT_COLUMNS)}>
          <span className="col-span-2 flex min-w-0 items-center gap-3 @3xl:col-span-1">
            <ProjectMark product={project.product} className="size-9" />
            <span className="min-w-0">
              <span className="block truncate font-semibold">{project.name}</span>
              <span className="block truncate text-xs text-muted-foreground">
                {project.client.businessName || project.client.name} · {project.estimatedEndDate ? `entrega ${formatDate(project.estimatedEndDate)}` : 'sin fecha de entrega'}
                {milestones.length > 0 && <> · <span className="tabular-nums">{approved}/{milestones.length}</span> hitos</>}
              </span>
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
            <span className="font-semibold tabular-nums text-foreground">{project.taskStats.open}</span> abiertas
            {project.taskStats.blocked > 0 && <span className="font-semibold text-rose-400"> · {project.taskStats.blocked} bloq.</span>}
            {project.taskStats.overdue > 0 && <span className="font-semibold text-rose-400"> · {project.taskStats.overdue} vencidas</span>}
          </span>
        </Link>
      </div>
      {milestones.length > 0 && (
        <div
          id={panelId}
          className={cn('grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none', open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}
          inert={!open}
        >
          <div className="overflow-hidden">
            <ol className="ml-[3.875rem] mr-5 mb-4 border-l border-border/70">
              {milestones.map((milestone, index) => {
                const status = MILESTONE_STATUS[milestone.status] ?? MILESTONE_STATUS.PENDING;
                const { done, total } = milestone.tasks;
                const overdue = !isDone(milestone.status) && milestone.dueDate && new Date(milestone.dueDate) < new Date();
                return (
                  <li key={milestone.id}>
                    <Link
                      href={`${href}/planning/milestones`}
                      className={cn('grid grid-cols-[1.75rem_minmax(0,1fr)_auto] items-center gap-x-3 rounded-r-md py-2 pr-3 text-sm transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none', 'sm:grid-cols-[1.75rem_minmax(0,1fr)_7rem_6.5rem_6rem]')}
                    >
                      <span className="relative flex items-center">
                        <span aria-hidden className={cn('-ml-[4.5px] size-2 rounded-full ring-4 ring-background', status.dot)} />
                        <span className="ml-2.5 text-[11px] tabular-nums text-muted-foreground">{index + 1}</span>
                      </span>
                      <span className={cn('truncate', isDone(milestone.status) ? 'text-muted-foreground' : 'font-medium')}>{milestone.title}</span>
                      <span className="text-xs text-muted-foreground">{status.label}</span>
                      <span className="hidden text-xs tabular-nums text-muted-foreground sm:block">
                        {total ? (
                          <>
                            <span className="font-semibold text-foreground">{done}</span>/{total} tareas
                          </>
                        ) : (
                          'sin tareas'
                        )}
                      </span>
                      <span className={cn('hidden text-xs tabular-nums sm:block', overdue ? 'font-semibold text-rose-400' : 'text-muted-foreground')}>
                        {milestone.dueDate ? formatDate(milestone.dueDate) : 'sin fecha'}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      )}
    </li>
  );
}
