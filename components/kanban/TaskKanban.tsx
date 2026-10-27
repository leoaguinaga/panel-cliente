'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Calendar, Eye, ListChecks, Lock, MessageSquare, Plus } from 'lucide-react';
import { KanbanAvatar, KanbanCard, KanbanColumn, KanbanScroller, useKanbanDrag } from './KanbanBoard';
import { cn } from '@/lib/utils';
import { EvidenceModal, TaskEvidenceItem } from '../agile/EvidenceUploader';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { formatCompactDate, formatProjectPriority, formatTaskStatus, taskCode } from '@/lib/formatters';
import { createTaskQuickAction, setTaskStatusAction } from '@/src/modules/projects/server/task-actions';
import type { ProjectMilestone, ProjectRequirement, ProjectSprint, ProjectTask, ProjectWorker } from '@/src/modules/projects/types';
import type { CatalogProduct } from '@/src/modules/products/server/queries';

export type TaskItem = Omit<ProjectTask, 'evidences'> & { evidences?: TaskEvidenceItem[] };

/** Bloqueada no es una columna: la tarjeta se queda en la de su estado previo, con su marca. */
const COLUMNS: Array<{ id: Exclude<TaskItem['status'], 'BLOCKED'>; title: string; dot: string }> = [
  { id: 'TODO', title: 'Por hacer', dot: 'bg-muted-foreground' },
  { id: 'IN_PROGRESS', title: 'En progreso', dot: 'bg-sky-400' },
  { id: 'REVIEW', title: 'En revisión', dot: 'bg-violet-400' },
  { id: 'DONE', title: 'Terminada', dot: 'bg-emerald-400' },
];
const columnOf = (task: Pick<TaskItem, 'status' | 'blockedFromStatus'>) => (task.status === 'BLOCKED' ? (task.blockedFromStatus ?? 'IN_PROGRESS') : task.status);
const STALE_DAYS = 3;
const daysSince = (date?: string) => (date ? Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 86400000)) : 0);

const field = 'mt-1 block h-9 w-full rounded-lg border bg-background px-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring';

export function TaskKanban({
  projectId,
  initialTasks,
  usesSprints = false,
  sprints = [],
  requirements = [],
  milestones = [],
  workers = [],
  products = [],
  leads = [],
}: {
  projectId: string;
  initialTasks: TaskItem[];
  usesSprints?: boolean;
  sprints?: ProjectSprint[];
  requirements?: ProjectRequirement[];
  milestones?: ProjectMilestone[];
  workers?: ProjectWorker[];
  products?: Pick<CatalogProduct, 'id' | 'name'>[];
  leads?: Array<{ id: string; name: string; companyName?: string | null }>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [tasks, setTasks] = useState<TaskItem[]>(initialTasks);
  const [syncedTasks, setSyncedTasks] = useState(initialTasks);
  if (syncedTasks !== initialTasks) {
    setSyncedTasks(initialTasks);
    setTasks(initialTasks);
  }
  const focusedTaskId = searchParams.get('task');
  const [boardError, setBoardError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [selectedSprintId, setSelectedSprintId] = useState<string>('ALL');
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>('ALL');
  const [evidenceModalTask, setEvidenceModalTask] = useState<TaskItem | null>(null);
  const [newTaskStatus, setNewTaskStatus] = useState<TaskItem['status'] | null>(null);
  const [newTaskError, setNewTaskError] = useState<string | null>(null);

  // Deep link (?task=): bring the card (or its parent) into view behind the drawer.
  useEffect(() => {
    if (!focusedTaskId) return;
    const target = tasks.find((task) => task.id === focusedTaskId);
    const card = document.getElementById(`task-${target?.parentId || focusedTaskId}`);
    card?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }, [focusedTaskId, tasks]);

  const taskHref = (taskId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('task', taskId);
    return `${pathname}?${params.toString()}`;
  };

  const moveTask = (task: TaskItem, targetStatus: TaskItem['status']) => {
    if (columnOf(task) === targetStatus) return;
    setBoardError(null);
    if (targetStatus === 'REVIEW' && !task.reviewer) {
      setBoardError(`${taskCode(task.number)} necesita un revisor antes de pasar a revisión. Asígnalo en el detalle de la tarea.`);
      router.replace(taskHref(task.id), { scroll: false });
      return;
    }
    const previous = tasks;
    setTasks((items) => items.map((item) => (item.id === task.id ? { ...item, status: targetStatus, blockedFromStatus: null, statusChangedAt: new Date().toISOString() } : item)));
    if (targetStatus === 'REVIEW') setEvidenceModalTask({ ...task, status: 'REVIEW' });
    startTransition(async () => {
      const result = await setTaskStatusAction(projectId, task.id, targetStatus);
      if (!result.ok) {
        setTasks(previous);
        setBoardError(`${taskCode(task.number)}: ${result.error}`);
      }
    });
  };

  const { dragged, dropTarget, dragProps, dropProps } = useKanbanDrag(tasks, (task, target) => moveTask(task, target as TaskItem['status']));

  const handleCreateTask = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const value = (key: string) => String(data.get(key) || '').trim() || null;
    const title = value('title');
    if (!title) return;
    const estimate = value('estimateHours');
    startTransition(async () => {
      setNewTaskError(null);
      const result = await createTaskQuickAction(projectId, {
        title,
        status: newTaskStatus || 'TODO',
        priority: value('priority') || 'MEDIUM',
        assignedToId: value('assignedToId'),
        reviewerId: value('reviewerId'),
        sprintId: value('sprintId'),
        milestoneId: value('milestoneId'),
        requirementId: value('requirementId'),
        plannedStartDate: value('plannedStartDate'),
        dueDate: value('dueDate'),
        estimateHours: estimate ? Number(estimate) : null,
        productId: value('productId'),
        leadId: value('leadId'),
      });
      if (!result.ok) {
        setNewTaskError(result.error);
        return;
      }
      setNewTaskStatus(null);
    });
  };

  // The board shows top-level work; subtasks live inside their task.
  const filteredTasks = tasks.filter((task) => {
    if (task.parentId) return false;
    if (selectedSprintId === 'BACKLOG' && task.sprint?.id) return false;
    if (selectedSprintId !== 'ALL' && selectedSprintId !== 'BACKLOG' && task.sprint?.id !== selectedSprintId) return false;
    if (selectedWorkerId === 'UNASSIGNED' && task.assignedTo) return false;
    if (!['ALL', 'UNASSIGNED'].includes(selectedWorkerId) && task.assignedTo?.id !== selectedWorkerId) return false;
    return true;
  });
  const topLevelCount = tasks.filter((task) => !task.parentId).length;
  const today = new Date().setHours(0, 0, 0, 0);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {usesSprints && <>
            <label className="sr-only" htmlFor="board-sprint">Sprint</label>
            <select id="board-sprint" value={selectedSprintId} onChange={(event) => setSelectedSprintId(event.target.value)} className="h-8 rounded-lg border bg-card px-2.5 text-[13px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <option value="ALL">Todos los sprints ({topLevelCount})</option>
              {sprints.map((sprint) => <option key={sprint.id} value={sprint.id}>{sprint.name}{sprint.status === 'ACTIVE' ? ' (activo)' : ''}</option>)}
              <option value="BACKLOG">Sin sprint</option>
            </select>
          </>}
          <label className="sr-only" htmlFor="board-worker">Responsable</label>
          <select id="board-worker" value={selectedWorkerId} onChange={(event) => setSelectedWorkerId(event.target.value)} className="h-8 rounded-lg border bg-card px-2.5 text-[13px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <option value="ALL">Todos los responsables</option>
            <option value="UNASSIGNED">Sin responsable</option>
            {workers.map((worker) => <option key={worker.id} value={worker.id}>{worker.name}</option>)}
          </select>
        </div>
        <Button onClick={() => setNewTaskStatus('TODO')} size="sm" className="gap-1.5">
          <Plus aria-hidden="true" />
          Nueva tarea
        </Button>
      </div>

      <div aria-live="polite">
        {boardError && (
          <p role="alert" className="flex items-start justify-between gap-3 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
            {boardError}
            <button type="button" onClick={() => setBoardError(null)} className="shrink-0 font-semibold underline-offset-2 hover:underline">Cerrar</button>
          </p>
        )}
      </div>

      <KanbanScroller label="Tablero de tareas del proyecto" columns={COLUMNS.length} fit>
        {COLUMNS.map((col) => {
          const colTasks = filteredTasks.filter((task) => columnOf(task) === col.id);
          return (
            <KanbanColumn
              key={col.id}
              column={col}
              count={colTasks.length}
              highlighted={dropTarget === col.id}
              dropProps={dropProps(col.id, col.id)}
              onAdd={col.id === 'DONE' ? undefined : () => setNewTaskStatus(col.id)}
              emptyLabel="Arrastra tareas aquí"
            >
              {colTasks.map((task) => {
                const due = task.dueDate || task.plannedEndDate;
                const overdue = Boolean(due) && task.status !== 'DONE' && new Date(due!).getTime() < today;
                const subtasks = task.subtasks || [];
                const doneSubtasks = subtasks.filter((subtask) => subtask.status === 'DONE').length;
                const comments = task._count?.comments || 0;
                const waiting = task.blockedBy?.some((dependency) => dependency.predecessor.status !== 'DONE');
                const isBlocked = task.status === 'BLOCKED';
                const done = task.status === 'DONE';
                const days = daysSince(task.statusChangedAt);
                const tracksAge = task.status === 'IN_PROGRESS' || task.status === 'REVIEW';
                return (
                  <KanbanCard key={task.id} id={`task-${task.id}`} dragProps={dragProps(task)} dragging={dragged === task.id} blocked={isBlocked} dimmed={done} focused={focusedTaskId === task.id}>
                    <div className="flex min-w-0 items-center gap-1.5 text-[11px] text-muted-foreground">
                      <span className="shrink-0 font-mono text-[10.5px]">{taskCode(task.number)}</span>
                      {task.requirement && <span className="min-w-0 truncate rounded border px-1.5 font-semibold">{task.requirement.code || 'REQ'}</span>}
                      {(task.priority === 'URGENT' || task.priority === 'HIGH') && (
                        <span className={cn('ml-auto shrink-0 rounded px-1.5 text-[10px] font-bold uppercase tracking-wide', task.priority === 'URGENT' ? 'bg-rose-500/15 text-rose-400' : 'bg-amber-500/15 text-amber-400')}>{formatProjectPriority(task.priority)}</span>
                      )}
                    </div>
                    <h3 className={cn('line-clamp-3 font-semibold leading-snug', done && 'line-through')}>
                      <Link href={taskHref(task.id)} scroll={false} draggable={false} data-card-open className="after:absolute after:inset-0 after:rounded-lg focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-ring" aria-label={`${taskCode(task.number)} ${task.title}. ${formatTaskStatus(task.status)}. Abrir detalle`}>
                        {task.title}
                      </Link>
                    </h3>
                    {isBlocked && (
                      <p className="flex items-center gap-1 text-[11px] font-semibold text-rose-400">
                        <Lock className="size-3" aria-hidden="true" />
                        Bloqueada{days > 0 && <span className="font-normal"> · hace {days} d</span>}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-muted-foreground">
                      {due && <span className={cn('inline-flex items-center gap-1 whitespace-nowrap', overdue && 'font-semibold text-rose-400')}><Calendar className="size-3" aria-hidden="true" />{overdue ? 'Venció ' : ''}{formatCompactDate(due)}</span>}
                      {tracksAge && days > 0 && <span className={cn('whitespace-nowrap tabular-nums', days >= STALE_DAYS && 'font-semibold text-amber-400')} title="Días en esta columna"><span aria-hidden="true">⏱ </span>{days} d</span>}
                      {subtasks.length > 0 && <span className="inline-flex items-center gap-1" title="Subtareas terminadas"><ListChecks className="size-3" aria-hidden="true" />{doneSubtasks}/{subtasks.length}</span>}
                      {comments > 0 && <span className="inline-flex items-center gap-1" title="Comentarios"><MessageSquare className="size-3" aria-hidden="true" />{comments}</span>}
                      {task.status === 'REVIEW' && task.reviewer && <span className="inline-flex items-center gap-1" title="Revisor"><Eye className="size-3" aria-hidden="true" />{task.reviewer.name.split(' ')[0]}</span>}
                      {waiting && !isBlocked && <span className="inline-flex items-center gap-1 text-amber-400" title="Tiene prerequisitos pendientes"><Lock className="size-3" aria-hidden="true" />Espera</span>}
                      <span className="ml-auto" title={task.assignedTo?.name ?? 'Sin responsable'}>
                        {task.assignedTo ? <KanbanAvatar name={task.assignedTo.name} /> : <span className="text-[10px]">Sin responsable</span>}
                      </span>
                    </div>
                  </KanbanCard>
                );
              })}
            </KanbanColumn>
          );
        })}
      </KanbanScroller>

      <Sheet open={newTaskStatus !== null} onOpenChange={(open) => { if (!open) { setNewTaskStatus(null); setNewTaskError(null); } }}>
        <SheetContent side="right" className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Nueva tarea</SheetTitle>
            <SheetDescription>Se crea en «{formatTaskStatus(newTaskStatus || 'TODO')}». Podrás dividirla en subtareas desde su detalle.</SheetDescription>
          </SheetHeader>
          <form onSubmit={handleCreateTask} className="space-y-3">
            <label className="block text-sm font-medium">Título<input name="title" required maxLength={200} autoFocus placeholder="Ej. Maquetar la página de inicio" className={field} /></label>
            <div className="grid grid-cols-2 gap-2.5">
              <label className="block text-sm font-medium">Responsable<select name="assignedToId" defaultValue="" className={field}><option value="">Sin responsable</option>{workers.map((worker) => <option key={worker.id} value={worker.id}>{worker.name}</option>)}</select></label>
              <label className="block text-sm font-medium">Revisor<select name="reviewerId" defaultValue="" className={field}><option value="">Sin revisor</option>{workers.map((worker) => <option key={worker.id} value={worker.id}>{worker.name}</option>)}</select></label>
              <label className="block text-sm font-medium">Inicio<input type="date" name="plannedStartDate" className={field} /></label>
              <label className="block text-sm font-medium">Vence<input type="date" name="dueDate" className={field} /></label>
              <label className="block text-sm font-medium">Estimación (horas)<input type="number" name="estimateHours" min={0} max={9999} step={0.5} inputMode="decimal" className={field} /></label>
              <label className="block text-sm font-medium">Prioridad<select name="priority" defaultValue="MEDIUM" className={field}>{['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map((value) => <option key={value} value={value}>{formatProjectPriority(value)}</option>)}</select></label>
              <label className="block text-sm font-medium">Hito<select name="milestoneId" defaultValue="" className={field}><option value="">Suelta (sin hito)</option>{milestones.map((milestone) => <option key={milestone.id} value={milestone.id}>{milestone.title}</option>)}</select></label>
              {usesSprints && <label className="block text-sm font-medium">Sprint<select name="sprintId" defaultValue={sprints.find((sprint) => sprint.status === 'ACTIVE')?.id || ''} className={field}><option value="">Sin sprint</option>{sprints.map((sprint) => <option key={sprint.id} value={sprint.id}>{sprint.name}</option>)}</select></label>}
            </div>
            <label className="block text-sm font-medium">Requerimiento<select name="requirementId" defaultValue="" className={field}><option value="">Sin requerimiento</option>{requirements.map((requirement) => <option key={requirement.id} value={requirement.id}>{requirement.code ? `${requirement.code} · ` : ''}{requirement.title}</option>)}</select><span className="mt-1 block text-xs font-normal text-muted-foreground">Si el requerimiento tiene hito, la tarea toma ese hito.</span></label>
            <div className="grid grid-cols-2 gap-2.5"><label className="block text-sm font-medium">Producto<select name="productId" defaultValue="" className={field}><option value="">Ninguno</option>{products.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label className="block text-sm font-medium">Lead<select name="leadId" defaultValue="" className={field}><option value="">Ninguno</option>{leads.map((item) => <option key={item.id} value={item.id}>{item.name}{item.companyName ? ` · ${item.companyName}` : ''}</option>)}</select></label></div>
            {newTaskError && <p role="alert" className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{newTaskError}</p>}
            <div className="flex justify-end gap-2 border-t pt-3">
              <Button type="button" variant="outline" size="sm" onClick={() => setNewTaskStatus(null)}>Cancelar</Button>
              <Button type="submit" size="sm" disabled={isPending}>{isPending ? 'Creando…' : 'Crear tarea'}</Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {evidenceModalTask && (
        <EvidenceModal projectId={projectId} taskId={evidenceModalTask.id} taskTitle={evidenceModalTask.title} evidences={evidenceModalTask.evidences || []} isOpen onClose={() => setEvidenceModalTask(null)} />
      )}
    </div>
  );
}
