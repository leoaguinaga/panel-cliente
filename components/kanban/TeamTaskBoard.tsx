'use client';

import { useState, useTransition, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ChevronDown, ListChecks, Lock, MessageSquare, Plus } from 'lucide-react';
import { KanbanAddButton, KanbanAvatar, KanbanCard, KanbanColumn, KanbanScroller, kanbanScrollbar, useKanbanDrag } from './KanbanBoard';
import { EvidenceModal } from '../agile/EvidenceUploader';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { formatCompactDate, formatProjectPriority, formatTaskStatus, taskCode } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { createTaskQuickAction, patchTaskAction, setTaskStatusAction } from '@/src/modules/projects/server/task-actions';
import type { BoardTask } from '@/src/modules/projects/server/queries';

type Status = BoardTask['status'];
type Column = { id: Exclude<Status, 'BLOCKED'>; title: string; dot: string };
type Person = { id: string; name: string };

/** Bloqueada no es una columna: la tarjeta se queda en la de su estado previo, con su marca. */
const COLUMNS: Column[] = [
  { id: 'TODO', title: 'Por hacer', dot: 'bg-muted-foreground' },
  { id: 'IN_PROGRESS', title: 'En progreso', dot: 'bg-sky-400' },
  { id: 'REVIEW', title: 'En revisión', dot: 'bg-violet-400' },
  { id: 'DONE', title: 'Terminada', dot: 'bg-emerald-400' },
];
const columnOf = (task: Pick<BoardTask, 'status' | 'blockedFromStatus'>): Column['id'] => (task.status === 'BLOCKED' ? (task.blockedFromStatus ?? 'IN_PROGRESS') : task.status);
/** A partir de cuántos días en curso o en revisión una tarjeta se marca como estancada. */
const STALE_DAYS = 3;
const daysSince = (date: string) => Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 86400000));
const UNASSIGNED = 'unassigned';

const firstName = (name: string) => name.trim().split(/\s+/)[0];
const startOfToday = () => new Date().setHours(0, 0, 0, 0);

export function TeamTaskBoard({
  initialTasks,
  view,
  currentUser,
  workers,
  projects,
  truncated,
  wipLimit,
  filterBar,
}: {
  initialTasks: BoardTask[];
  wipLimit: number;
  view: string;
  currentUser: Person;
  workers: Person[];
  projects: Person[];
  truncated: boolean;
  filterBar: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [tasks, setTasks] = useState(initialTasks);
  const [synced, setSynced] = useState(initialTasks);
  if (synced !== initialTasks) {
    setSynced(initialTasks);
    setTasks(initialTasks);
  }
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState<{ status: Column['id']; assigneeId: string | null } | null>(null);
  const [evidenceTask, setEvidenceTask] = useState<BoardTask | null>(null);
  const [, startTransition] = useTransition();

  const href = (task: BoardTask) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('task', task.id);
    params.set('taskProject', task.project.id);
    return `${pathname}?${params}`;
  };
  const doneHistoryHref = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('status', 'DONE');
    return `${pathname}?${params}`;
  };

  /** Mueve la tarjeta; en la vista Equipo también puede cambiar de responsable. */
  const move = (task: BoardTask, target: Column['id'], assigneeId?: string) => {
    const nextAssignee = assigneeId === undefined ? task.assignedTo?.id ?? null : assigneeId === UNASSIGNED ? null : assigneeId;
    const sameStatus = columnOf(task) === target;
    const sameAssignee = nextAssignee === (task.assignedTo?.id ?? null);
    if (sameStatus && sameAssignee) return;
    setError(null);
    if (!sameStatus && target === 'REVIEW' && !task.reviewer) {
      setError(`${taskCode(task.number)} necesita un revisor antes de pasar a revisión. Asígnalo en el detalle.`);
      router.replace(href(task), { scroll: false });
      return;
    }
    const status: Status = sameStatus ? task.status : target;
    const person = nextAssignee ? workers.find((worker) => worker.id === nextAssignee) ?? { id: nextAssignee, name: '…' } : null;
    const previous = tasks;
    const moved = sameStatus ? {} : { statusChangedAt: new Date().toISOString(), blockedFromStatus: null };
    setTasks((items) => items.map((item) => (item.id === task.id ? { ...item, ...moved, status, assignedTo: person } : item)));
    if (!sameStatus && target === 'REVIEW') setEvidenceTask({ ...task, status });
    startTransition(async () => {
      const result = sameAssignee
        ? await setTaskStatusAction(task.project.id, task.id, status)
        : await patchTaskAction(task.project.id, task.id, { ...(sameStatus ? {} : { status }), assignedToId: nextAssignee });
      if (!result.ok) {
        setTasks(previous);
        setError(`${taskCode(task.number)}: ${result.error}`);
      }
    });
  };

  const { dragged, dropTarget, dragProps, dropProps } = useKanbanDrag(tasks, (task, target, lane) => move(task, target as Column['id'], lane));

  const open = tasks.filter((task) => task.status !== 'DONE');
  const today = startOfToday();
  const isOverdue = (task: BoardTask) => Boolean(task.dueDate) && task.status !== 'DONE' && new Date(task.dueDate!).getTime() < today;
  const inProgress = (items: BoardTask[]) => items.filter((task) => columnOf(task) === 'IN_PROGRESS').length;
  const overdue = open.filter(isOverdue).length;
  const blocked = open.filter((task) => task.status === 'BLOCKED').length;
  const projectCount = new Set(open.map((task) => task.project.id)).size;

  const cardProps = { href, dragProps, dragged, isOverdue, view };

  return (
    <section className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Tareas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {view === 'mine' ? (
              <>
                <span className={cn('font-semibold', inProgress(open) > wipLimit ? 'text-rose-400' : 'text-foreground')}>{inProgress(open)} en curso</span> de {wipLimit} permitidas
              </>
            ) : (
              <>
                <span className="font-semibold text-foreground">{open.length} abiertas</span> en {projectCount} {projectCount === 1 ? 'proyecto' : 'proyectos'}
              </>
            )}
            {overdue > 0 && <span className="font-semibold text-rose-400"> · {overdue} {overdue === 1 ? 'vencida' : 'vencidas'}</span>}
            {blocked > 0 && <span> · {blocked} {blocked === 1 ? 'bloqueada' : 'bloqueadas'}</span>}
          </p>
        </div>
        <Button onClick={() => setCreating({ status: 'TODO', assigneeId: view === 'mine' ? currentUser.id : null })} className="gap-1.5">
          <Plus aria-hidden />
          Nueva tarea
        </Button>
      </header>

      {filterBar}

      <div aria-live="polite">
        {error && (
          <p role="alert" className="flex items-start justify-between gap-3 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
            {error}
            <button type="button" onClick={() => setError(null)} className="shrink-0 font-semibold underline-offset-2 hover:underline">
              Cerrar
            </button>
          </p>
        )}
        {truncated && <p className="text-xs text-muted-foreground">Se muestran las primeras 400 tareas. Filtra para ver el resto.</p>}
      </div>

      {view === 'team' ? (
        <Lanes tasks={tasks} wipLimit={wipLimit} currentUser={currentUser} dropProps={dropProps} dropTarget={dropTarget} inProgress={inProgress} onCreate={setCreating} doneHref={doneHistoryHref()} {...cardProps} />
      ) : (
        <KanbanScroller label="Tablero de tareas" columns={COLUMNS.length} fit>
          {COLUMNS.map((column) => {
            const items = tasks.filter((task) => columnOf(task) === column.id);
            const limited = view === 'mine' && column.id === 'IN_PROGRESS';
            const over = limited && items.length > wipLimit;
            return (
              <KanbanColumn
                key={column.id}
                column={column}
                count={items.length}
                meta={column.id === 'DONE' ? '7 días' : limited ? `${items.length} / ${wipLimit}` : undefined}
                over={over}
                highlighted={dropTarget === column.id}
                dropProps={dropProps(column.id, column.id)}
                onAdd={column.id === 'DONE' ? undefined : () => setCreating({ status: column.id, assigneeId: view === 'mine' ? currentUser.id : null })}
                note={over && <p className="px-1 text-xs text-rose-400">Pasaste tu límite: termina una antes de tomar otra.</p>}
                emptyLabel={column.id === 'DONE' ? 'Nada terminado esta semana' : 'Arrastra tareas aquí'}
                footer={
                  column.id === 'TODO' ? (
                    <KanbanAddButton label="Añadir tarea" onClick={() => setCreating({ status: 'TODO', assigneeId: view === 'mine' ? currentUser.id : null })} />
                  ) : column.id === 'DONE' && !searchParams.get('status') ? (
                    <Link href={doneHistoryHref()} className="py-1 text-center text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground">
                      Ver historial completo
                    </Link>
                  ) : undefined
                }
              >
                {items.map((task) => (
                  <TaskCard key={task.id} task={task} {...cardProps} />
                ))}
              </KanbanColumn>
            );
          })}
        </KanbanScroller>
      )}

      <QuickCreate
        state={creating}
        onClose={() => setCreating(null)}
        workers={workers}
        projects={projects}
        defaultProjectId={searchParams.get('projectId')?.split(',').length === 1 ? searchParams.get('projectId')! : ''}
      />
      {evidenceTask && <EvidenceModal projectId={evidenceTask.project.id} taskId={evidenceTask.id} taskTitle={evidenceTask.title} evidences={[]} isOpen onClose={() => setEvidenceTask(null)} />}
    </section>
  );
}

type CardProps = {
  href: (task: BoardTask) => string;
  dragProps: (task: BoardTask) => Record<string, unknown>;
  dragged: string | null;
  isOverdue: (task: BoardTask) => boolean;
  view: string;
};

function TaskCard({ task, href, dragProps, dragged, isOverdue, view, compact = false }: CardProps & { task: BoardTask; compact?: boolean }) {
  const done = task.status === 'DONE';
  const late = isOverdue(task);
  const dueToday = !late && !done && Boolean(task.dueDate) && new Date(task.dueDate!).setHours(0, 0, 0, 0) === startOfToday();
  const doneSubtasks = task.subtasks.filter((subtask) => subtask.status === 'DONE').length;
  const waiting = task.blockedBy.some((dependency) => dependency.predecessor.status !== 'DONE');
  const isBlocked = task.status === 'BLOCKED';
  const days = daysSince(task.statusChangedAt);
  const tracksAge = isBlocked || task.status === 'IN_PROGRESS' || task.status === 'REVIEW';
  const stale = tracksAge && days >= STALE_DAYS;
  const label = `${taskCode(task.number)} ${task.title}. ${formatTaskStatus(task.status)}. Abrir detalle`;
  return (
    <KanbanCard dragProps={dragProps(task)} dragging={dragged === task.id} blocked={isBlocked} dimmed={done} compact={compact}>
      {!compact && (
        <div className="flex min-w-0 items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="shrink-0 font-mono text-[10.5px]">{taskCode(task.number)}</span>
          <span className="min-w-0 truncate rounded border px-1.5 font-semibold">{task.project.name}</span>
          {(task.priority === 'URGENT' || task.priority === 'HIGH') && (
            <span className={cn('ml-auto shrink-0 rounded px-1.5 text-[10px] font-bold uppercase tracking-wide', task.priority === 'URGENT' ? 'bg-rose-500/15 text-rose-400' : 'bg-amber-500/15 text-amber-400')}>
              {formatProjectPriority(task.priority)}
            </span>
          )}
        </div>
      )}
      <h3 className={cn('font-semibold leading-snug', compact ? 'line-clamp-2 text-xs' : 'line-clamp-3', done && 'line-through')}>
        <Link href={href(task)} scroll={false} draggable={false} data-card-open aria-label={label} className="after:absolute after:inset-0 after:rounded-lg focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-ring">
          {compact && <span className="mr-1 font-mono text-[10px] font-normal text-muted-foreground">{taskCode(task.number)}</span>}
          {task.title}
        </Link>
      </h3>
      {task.parent && <p className="truncate text-[11px] text-muted-foreground">Subtarea de {taskCode(task.parent.number)} {task.parent.title}</p>}
      {isBlocked && (
        <p className="flex items-center gap-1 text-[11px] font-semibold text-rose-400">
          <Lock className="size-3" aria-hidden />
          Bloqueada{days > 0 && <span className="font-normal"> · hace {days} d</span>}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-muted-foreground">
        {done ? (
          <span>Terminada {task.completedAt ? formatCompactDate(task.completedAt) : ''}</span>
        ) : (
          task.dueDate && <span className={cn('whitespace-nowrap', late && 'font-semibold text-rose-400', dueToday && 'font-semibold text-amber-400')}>{late ? 'Venció ' : dueToday ? 'Vence hoy' : ''}{dueToday ? '' : formatCompactDate(task.dueDate)}</span>
        )}
        {tracksAge && !isBlocked && days > 0 && (
          <span className={cn('whitespace-nowrap tabular-nums', stale && 'font-semibold text-amber-400')} title={`${days} ${days === 1 ? 'día' : 'días'} en ${formatTaskStatus(task.status).toLowerCase()}`}>
            <span aria-hidden>⏱ </span>
            {days} d
          </span>
        )}
        {compact && <span className="truncate">{task.project.name}</span>}
        {!compact && task.subtasks.length > 0 && (
          <span className="inline-flex items-center gap-1" title="Subtareas terminadas">
            <ListChecks className="size-3" aria-hidden />
            {doneSubtasks}/{task.subtasks.length}
          </span>
        )}
        {!compact && task._count.comments > 0 && (
          <span className="inline-flex items-center gap-1" title="Comentarios">
            <MessageSquare className="size-3" aria-hidden />
            {task._count.comments}
          </span>
        )}
        {waiting && !isBlocked && (
          <span className="inline-flex items-center gap-1 text-amber-400" title="Tiene prerequisitos pendientes">
            <Lock className="size-3" aria-hidden />
            Espera
          </span>
        )}
        {!compact && task.status === 'REVIEW' && task.reviewer && <span title="Revisor">Revisa {firstName(task.reviewer.name)}</span>}
        {!compact && view !== 'mine' && (
          <span className="ml-auto" title={task.assignedTo?.name ?? 'Sin responsable'}>
            {task.assignedTo ? <KanbanAvatar name={task.assignedTo.name} /> : <span className="text-[10px]">Sin responsable</span>}
          </span>
        )}
      </div>
    </KanbanCard>
  );
}

function Lanes({
  tasks,
  wipLimit,
  currentUser,
  dropProps,
  dropTarget,
  inProgress,
  onCreate,
  doneHref,
  ...cardProps
}: CardProps & {
  tasks: BoardTask[];
  wipLimit: number;
  currentUser: Person;
  dropProps: (key: string, target: Column['id'], assigneeId?: string) => Record<string, unknown>;
  dropTarget: string | null;
  inProgress: (items: BoardTask[]) => number;
  onCreate: (state: { status: Column['id']; assigneeId: string | null }) => void;
  doneHref: string;
}) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  // Personas con trabajo en el tablero: tú primero, «Sin responsable» al final.
  const people = new Map<string, Person>();
  for (const task of tasks) if (task.assignedTo) people.set(task.assignedTo.id, task.assignedTo);
  const lanes: Person[] = [
    ...(people.has(currentUser.id) ? [people.get(currentUser.id)!] : []),
    ...[...people.values()].filter((person) => person.id !== currentUser.id).sort((a, b) => a.name.localeCompare(b.name)),
    ...(tasks.some((task) => !task.assignedTo) ? [{ id: UNASSIGNED, name: 'Sin responsable' }] : []),
  ];
  const toggle = (id: string) =>
    setCollapsed((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  if (!lanes.length) return <p className="rounded-xl border p-6 text-center text-sm text-muted-foreground">No hay tareas con estos filtros.</p>;

  return (
    <div className={cn('overflow-x-auto rounded-xl border', kanbanScrollbar)}>
      <div className="min-w-[760px]">
        <div className="grid grid-cols-[160px_repeat(4,minmax(0,1fr))] border-b bg-card/60 text-xs font-semibold">
          <div className="px-3 py-2.5 text-muted-foreground">Persona</div>
          {COLUMNS.map((column) => (
            <div key={column.id} className="flex items-center gap-2 border-l px-3 py-2.5">
              <span aria-hidden className={cn('size-2 rounded-full', column.dot)} />
              {column.title}
              {column.id === 'DONE' && <Link href={doneHref} className="ml-auto font-medium text-muted-foreground underline-offset-4 hover:underline">7 días</Link>}
            </div>
          ))}
        </div>
        {lanes.map((person) => {
          const mine = tasks.filter((task) => (task.assignedTo?.id ?? UNASSIGNED) === person.id);
          const running = inProgress(mine);
          const over = person.id !== UNASSIGNED && running > wipLimit;
          const isCollapsed = collapsed.has(person.id);
          return (
            <div key={person.id} className="grid grid-cols-[160px_repeat(4,minmax(0,1fr))] border-b last:border-b-0">
              <div className="flex flex-col gap-1 bg-card/60 px-3 py-3">
                <button type="button" onClick={() => toggle(person.id)} aria-expanded={!isCollapsed} className="flex items-center gap-2 text-left text-[13px] font-semibold hover:text-foreground">
                  {person.id === UNASSIGNED ? <span aria-hidden className="grid size-6 place-items-center rounded-full border border-dashed text-[10px] text-muted-foreground">—</span> : <KanbanAvatar name={person.name} me={person.id === currentUser.id} />}
                  <span className="min-w-0 flex-1 truncate">{person.id === currentUser.id ? `${person.name} (tú)` : person.name}</span>
                  <ChevronDown aria-hidden className={cn('size-3.5 shrink-0 text-muted-foreground transition-transform', isCollapsed && '-rotate-90')} />
                </button>
                <span className={cn('pl-8 text-[11px] text-muted-foreground', over && 'font-semibold text-rose-400')}>
                  {person.id === UNASSIGNED ? `${mine.length} sin asignar` : `${running} en curso · límite ${wipLimit}`}
                </span>
              </div>
              {COLUMNS.map((column) => {
                const items = mine.filter((task) => columnOf(task) === column.id);
                const key = `${person.id}:${column.id}`;
                return (
                  <div
                    key={column.id}
                    {...dropProps(key, column.id, person.id)}
                    className={cn(
                      'group/cell min-h-16 border-l p-2 transition-colors',
                      over && column.id === 'IN_PROGRESS' && 'bg-rose-500/[0.05]',
                      dropTarget === key && 'bg-muted/50',
                    )}
                  >
                    {isCollapsed ? (
                      items.length > 0 && <p className="px-1 text-xs tabular-nums text-muted-foreground">{items.length}</p>
                    ) : (
                      <ul className="flex flex-col gap-1.5">
                        {items.map((task) => (
                          <TaskCard key={task.id} task={task} compact {...cardProps} />
                        ))}
                        {column.id === 'TODO' && (
                          <li>
                            <button
                              type="button"
                              onClick={() => onCreate({ status: 'TODO', assigneeId: person.id === UNASSIGNED ? null : person.id })}
                              className="flex w-full items-center gap-1 rounded-md px-1.5 py-1 text-[11px] text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground focus-visible:opacity-100 group-hover/cell:opacity-100"
                            >
                              <Plus className="size-3" aria-hidden />
                              Añadir
                            </button>
                          </li>
                        )}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const field = 'mt-1 block h-9 w-full rounded-lg border bg-background px-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring';

function QuickCreate({
  state,
  onClose,
  workers,
  projects,
  defaultProjectId,
}: {
  state: { status: Column['id']; assigneeId: string | null } | null;
  onClose: () => void;
  workers: Person[];
  projects: Person[];
  defaultProjectId: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const value = (key: string) => String(data.get(key) || '').trim() || null;
    const projectId = value('projectId');
    const title = value('title');
    if (!projectId || !title || !state) return;
    startTransition(async () => {
      setError(null);
      const result = await createTaskQuickAction(projectId, {
        title,
        status: state.status,
        priority: value('priority') || 'MEDIUM',
        assignedToId: value('assignedToId'),
        dueDate: value('dueDate'),
      });
      if (!result.ok) return setError(result.error);
      onClose();
    });
  };
  return (
    <Sheet open={state !== null} onOpenChange={(open) => { if (!open) { setError(null); onClose(); } }}>
      <SheetContent side="right" className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Nueva tarea</SheetTitle>
          <SheetDescription>Se crea en «{formatTaskStatus(state?.status ?? 'TODO')}». El resto de campos se completan desde su detalle.</SheetDescription>
        </SheetHeader>
        {state && (
          <form key={`${state.status}-${state.assigneeId}`} onSubmit={submit} className="space-y-3">
            <label className="block text-sm font-medium">
              Título
              <input name="title" required maxLength={200} autoFocus placeholder="Ej. Maquetar la página de inicio" className={field} />
            </label>
            <label className="block text-sm font-medium">
              Proyecto
              <select name="projectId" required defaultValue={defaultProjectId} className={field}>
                <option value="" disabled>
                  Elige un proyecto
                </option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm font-medium">
                Responsable
                <select name="assignedToId" defaultValue={state.assigneeId ?? ''} className={field}>
                  <option value="">Sin responsable</option>
                  {workers.map((worker) => (
                    <option key={worker.id} value={worker.id}>
                      {worker.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-medium">
                Prioridad
                <select name="priority" defaultValue="MEDIUM" className={field}>
                  {['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map((priority) => (
                    <option key={priority} value={priority}>
                      {formatProjectPriority(priority)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-medium">
                Vence
                <input type="date" name="dueDate" className={field} />
              </label>
            </div>
            {error && <p role="alert" className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</p>}
            <div className="flex justify-end gap-2 border-t pt-3">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? 'Creando…' : 'Crear tarea'}
              </Button>
            </div>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
}
