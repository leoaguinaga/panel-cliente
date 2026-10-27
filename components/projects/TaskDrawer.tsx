'use client';

import { useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Camera, Check, CornerDownLeft, Eye, Flag, Link2, Trash2 } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { EvidenceModal } from '@/components/agile/EvidenceUploader';
import { TaskDependencyEditor } from '@/components/projects/TaskDependencyEditor';
import { formatCompactDate, formatProjectPriority, formatTaskStatus, taskCode } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import {
  addTaskCommentAction,
  createTaskQuickAction,
  deleteTaskCommentAction,
  deleteTaskQuickAction,
  patchTaskAction,
  reviewTaskAction,
  setTaskStatusAction,
  type TaskActionResult,
  type TaskPatch,
} from '@/src/modules/projects/server/task-actions';
import type { ProjectMilestone, ProjectRequirement, ProjectSprint, ProjectTask, ProjectWorker, TaskDetail, TaskPerson } from '@/src/modules/projects/types';
import type { CatalogProduct } from '@/src/modules/products/server/queries';

const STATUSES = ['TODO', 'IN_PROGRESS', 'REVIEW', 'BLOCKED', 'DONE'] as const;
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;
const STATUS_DOT: Record<string, string> = { TODO: 'bg-slate-400', IN_PROGRESS: 'bg-blue-600', REVIEW: 'bg-violet-600', BLOCKED: 'bg-rose-600', DONE: 'bg-emerald-600' };
const field = 'min-h-9 w-full rounded-lg border border-slate-200 bg-card px-2.5 text-xs text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:opacity-60';
const dateTime = new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

const initials = (name?: string | null) => (name ? name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() : '');
const day = (value?: string | null) => (value ? value.slice(0, 10) : '');

function Avatar({ person, size = 'size-6' }: { person: TaskPerson | null; size?: string }) {
  if (!person) return <span className={`${size} inline-flex shrink-0 items-center justify-center rounded-full border border-dashed border-slate-300 text-[10px] text-slate-400`} aria-label="Sin responsable">?</span>;
  return <span className={`${size} inline-flex shrink-0 items-center justify-center rounded-full bg-slate-700 text-[10px] font-bold text-white`} title={person.name} aria-hidden="true">{initials(person.name)}</span>;
}

function CommentBody({ body }: { body: string }) {
  return <>{body.split(/(@[\p{L}\p{N}_.-]+)/u).map((part, index) => part.startsWith('@') ? <span key={index} className="font-semibold text-blue-700">{part}</span> : part)}</>;
}

export function TaskDrawer({
  projectId,
  task,
  tasks,
  workers,
  milestones,
  sprints,
  requirements,
  usesSprints,
  currentUser,
  products = [],
  leads = [],
}: {
  projectId: string;
  task: TaskDetail;
  tasks: ProjectTask[];
  workers: ProjectWorker[];
  milestones: ProjectMilestone[];
  sprints: ProjectSprint[];
  requirements: ProjectRequirement[];
  usesSprints: boolean;
  currentUser: { id: string; role: string };
  products?: Pick<CatalogProduct, 'id' | 'name'>[];
  leads?: Array<{ id: string; name: string; companyName?: string | null }>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [status, setStatus] = useState(task.status);
  const [association, setAssociation] = useState<'none' | 'product' | 'lead'>(task.productId ? 'product' : task.leadId ? 'lead' : 'none');
  const [associationId, setAssociationId] = useState(task.productId || task.leadId || '');
  // El hito se hereda de la tarea principal o del requerimiento (si este tiene hito)
  const requirementMilestone = requirements.find((requirement) => requirement.id === task.requirement?.id)?.milestoneId;
  const inheritedMilestone = task.parentId
    ? 'Lo toma de la tarea principal'
    : requirementMilestone
      ? `Lo toma del requerimiento ${task.requirement?.code || task.requirement?.title || ''}`.trim()
      : null;
  const [syncedStatus, setSyncedStatus] = useState(task.status);
  if (syncedStatus !== task.status) {
    setSyncedStatus(task.status);
    setStatus(task.status);
  }
  const [tab, setTab] = useState<'comments' | 'activity'>('comments');
  const [returning, setReturning] = useState(false);
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const commentRef = useRef<HTMLTextAreaElement>(null);
  const subtaskRef = useRef<HTMLInputElement>(null);

  const hrefFor = (taskId: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (taskId) params.set('task', taskId);
    else params.delete('task');
    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  };
  const close = () => router.replace(hrefFor(null), { scroll: false });

  const perform = (request: () => Promise<TaskActionResult>, done?: string, onError?: () => void) =>
    startTransition(async () => {
      setError(null);
      setNotice(null);
      const result = await request();
      if (!result.ok) {
        setError(result.error);
        onError?.();
        return;
      }
      if (done) setNotice(done);
    });

  const save = (element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement, patch: TaskPatch, previous: string) =>
    perform(() => patchTaskAction(projectId, task.id, patch), 'Cambios guardados.', () => { element.value = previous; });

  const changeStatus = (next: ProjectTask['status']) => {
    const previous = status;
    setStatus(next);
    perform(() => setTaskStatusAction(projectId, task.id, next), `Estado: ${formatTaskStatus(next)}.`, () => setStatus(previous));
  };

  const isSubtask = Boolean(task.parent);
  const canReview = status === 'REVIEW' && (task.reviewer?.id === currentUser.id || currentUser.role === 'ADMIN');
  const doneSubtasks = task.subtasks.filter((subtask) => subtask.status === 'DONE');
  const hours = (items: Array<{ estimateHours?: string | number | null }>) => items.reduce((sum, item) => sum + Number(item.estimateHours || 0), 0);
  const totalHours = hours(task.subtasks);

  return (
    <Sheet open onOpenChange={(open) => { if (!open) close(); }}>
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto p-0 sm:max-w-xl" onOpenAutoFocus={(event) => { event.preventDefault(); (event.currentTarget as HTMLElement).focus(); }}>
        <SheetHeader className="space-y-2 border-b border-slate-100 px-5 pb-4 pt-5">
          <nav aria-label="Ubicación de la tarea" className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
            {task.milestone && <span className="inline-flex items-center gap-1"><Flag className="size-3" aria-hidden="true" />{task.milestone.title}</span>}
            {task.parent && <><span aria-hidden="true">›</span><Link href={hrefFor(task.parent.id)} scroll={false} className="font-medium text-slate-600 underline-offset-2 hover:underline">{taskCode(task.parent.number)} {task.parent.title}</Link></>}
            <span aria-hidden="true">›</span><span className="font-mono">{taskCode(task.number)}</span>
          </nav>
          <SheetTitle className="sr-only">{task.title}</SheetTitle>
          <SheetDescription className="sr-only">Detalle, subtareas y conversación de la tarea {taskCode(task.number)}.</SheetDescription>
          <label className="block">
            <span className="sr-only">Título</span>
            <textarea
              key={`title-${task.id}`}
              defaultValue={task.title}
              maxLength={200}
              rows={1}
              onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); event.currentTarget.blur(); } }}
              onBlur={(event) => { const value = event.currentTarget.value.replace(/\s+/g, ' ').trim(); if (value && value !== task.title) save(event.currentTarget, { title: value }, task.title); else event.currentTarget.value = task.title; }}
              className="w-full resize-none rounded-lg border border-transparent bg-transparent px-1 py-0.5 text-lg font-bold leading-snug text-slate-900 [field-sizing:content] hover:border-slate-200 focus-visible:border-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            />
          </label>
        </SheetHeader>

        <div className="space-y-5 px-5 py-4">
          <div aria-live="polite" className="min-h-0">
            {error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p>}
            {!error && notice && <p className="text-[11px] text-slate-500">{pending ? 'Guardando…' : notice}</p>}
          </div>

          {/* Review */}
          {status === 'REVIEW' && (
            <section aria-label="Revisión" className="rounded-xl border border-violet-200 bg-violet-50/60 p-3">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-violet-800"><Eye className="size-3.5" aria-hidden="true" />Esperando revisión de {task.reviewer?.name || 'un revisor'}</p>
              {canReview && !returning && (
                <div className="mt-2.5 flex flex-wrap gap-2">
                  <button type="button" disabled={pending} onClick={() => perform(() => reviewTaskAction(projectId, task.id, 'APPROVE'), 'Revisión aprobada: la tarea quedó terminada.')} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"><Check className="size-3.5" aria-hidden="true" />Aprobar</button>
                  <button type="button" disabled={pending} onClick={() => setReturning(true)} className="min-h-9 rounded-lg border border-slate-300 bg-card px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50">Devolver con comentario</button>
                </div>
              )}
              {canReview && returning && (
                <form className="mt-2.5 space-y-2" onSubmit={(event) => { event.preventDefault(); const note = String(new FormData(event.currentTarget).get('note') || '').trim(); if (!note) { setError('Explica qué falta para devolver la tarea.'); return; } perform(() => reviewTaskAction(projectId, task.id, 'RETURN', note), 'Tarea devuelta a En progreso.'); setReturning(false); }}>
                  <label className="block text-[11px] font-semibold text-slate-700">Qué falta corregir<textarea name="note" required rows={3} autoFocus className={`${field} mt-1 py-2`} /></label>
                  <div className="flex gap-2"><button type="submit" disabled={pending} className="min-h-9 rounded-lg bg-brand-button px-3 text-xs font-semibold text-white">Devolver</button><button type="button" onClick={() => setReturning(false)} className="min-h-9 rounded-lg px-3 text-xs font-medium text-slate-600 hover:bg-slate-100">Cancelar</button></div>
                </form>
              )}
            </section>
          )}

          {/* Properties */}
          <section aria-label="Propiedades" className="grid grid-cols-[6.5rem_1fr] items-center gap-x-3 gap-y-2 text-xs" key={`props-${task.id}`}>
            <label htmlFor="task-status" className="text-slate-500">Estado</label>
            <div className="flex items-center gap-2">
              <span className={`size-2 shrink-0 rounded-full ${STATUS_DOT[status]}`} aria-hidden="true" />
              <select id="task-status" value={status} disabled={pending} onChange={(event) => changeStatus(event.target.value as ProjectTask['status'])} className={field}>
                {STATUSES.map((value) => <option key={value} value={value} disabled={value === 'REVIEW' && !task.reviewer}>{formatTaskStatus(value)}{value === 'REVIEW' && !task.reviewer ? ' (requiere revisor)' : ''}</option>)}
              </select>
            </div>

            <label htmlFor="task-assignee" className="text-slate-500">Responsable</label>
            <select id="task-assignee" defaultValue={task.assignedTo?.id || ''} onChange={(event) => save(event.currentTarget, { assignedToId: event.target.value || null }, task.assignedTo?.id || '')} className={field}>
              <option value="">Sin responsable</option>
              {workers.map((worker) => <option key={worker.id} value={worker.id}>{worker.name}</option>)}
            </select>

            {projectId ? (
              <div className="space-y-1.5 rounded-lg border border-slate-200 bg-muted/30 p-3">
                <p className="text-xs font-semibold text-slate-700">Vínculo: proyecto</p>
                <p className="text-xs text-slate-500">Esta tarea pertenece al proyecto actual. Solo puede tener un vínculo.</p>
              </div>
            ) : (
              <fieldset className="space-y-2">
                <legend className="text-xs font-medium text-slate-500">Vínculo</legend>
                <div className="grid grid-cols-3 gap-1 rounded-lg border border-slate-200 bg-muted/40 p-1" role="group" aria-label="Tipo de vínculo de la tarea">
                  {(['none', 'product', 'lead'] as const).map((value) => {
                    const label = { none: 'Ninguno', product: 'Producto', lead: 'Lead' }[value];
                    return <button key={value} type="button" aria-pressed={association === value} disabled={pending} onClick={() => {
                      setAssociation(value);
                      const nextId = value === 'product' ? task.productId || '' : value === 'lead' ? task.leadId || '' : '';
                      setAssociationId(nextId);
                      perform(() => patchTaskAction(projectId, task.id, { productId: value === 'product' ? nextId || null : null, leadId: value === 'lead' ? nextId || null : null }), value === 'none' ? 'Vínculo quitado.' : 'Vínculo actualizado.');
                    }} className={cn('min-h-8 rounded-md px-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60', association === value ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>{label}</button>;
                  })}
                </div>
                {association !== 'none' && <label htmlFor="task-association" className="sr-only">{association === 'product' ? 'Seleccionar producto' : 'Seleccionar lead'}</label>}
                {association !== 'none' && <select id="task-association" value={associationId} disabled={pending} required onChange={(event) => {
                  const nextId = event.target.value;
                  setAssociationId(nextId);
                  perform(() => patchTaskAction(projectId, task.id, { productId: association === 'product' ? nextId || null : null, leadId: association === 'lead' ? nextId || null : null }), 'Vínculo actualizado.');
                }} className={field}>
                  <option value="">Seleccionar {association === 'product' ? 'producto' : 'lead'}</option>
                  {association === 'product' ? products.map((item) => <option key={item.id} value={item.id}>{item.name}</option>) : leads.map((item) => <option key={item.id} value={item.id}>{item.name}{item.companyName ? ` · ${item.companyName}` : ''}</option>)}
                </select>}
                <p className="text-xs text-slate-500">Elige un producto o un lead; nunca ambos.</p>
              </fieldset>
            )}

            <label htmlFor="task-reviewer" className="text-slate-500">Revisor</label>
            <select id="task-reviewer" defaultValue={task.reviewer?.id || ''} onChange={(event) => save(event.currentTarget, { reviewerId: event.target.value || null }, task.reviewer?.id || '')} className={field}>
              <option value="">Sin revisor</option>
              {workers.map((worker) => <option key={worker.id} value={worker.id}>{worker.name}</option>)}
            </select>

            <label htmlFor="task-priority" className="text-slate-500">Prioridad</label>
            <select id="task-priority" defaultValue={task.priority} onChange={(event) => save(event.currentTarget, { priority: event.target.value }, task.priority)} className={field}>
              {PRIORITIES.map((value) => <option key={value} value={value}>{formatProjectPriority(value)}</option>)}
            </select>

            <span className="text-slate-500">Fechas</span>
            <div className="grid grid-cols-2 gap-2">
              <label className="text-[10px] font-medium text-slate-500">Inicio<input type="date" defaultValue={day(task.plannedStartDate)} onChange={(event) => save(event.currentTarget, { plannedStartDate: event.target.value || null }, day(task.plannedStartDate))} className={`${field} mt-0.5`} /></label>
              <label className="text-[10px] font-medium text-slate-500">Vence<input type="date" defaultValue={day(task.dueDate)} onChange={(event) => save(event.currentTarget, { dueDate: event.target.value || null }, day(task.dueDate))} className={`${field} mt-0.5`} /></label>
            </div>

            <label htmlFor="task-estimate" className="text-slate-500">Estimación</label>
            <div className="flex items-center gap-2">
              <input id="task-estimate" type="number" min={0} max={9999} step={0.5} inputMode="decimal" defaultValue={task.estimateHours != null ? Number(task.estimateHours) : ''} onBlur={(event) => { const previous = task.estimateHours != null ? String(Number(task.estimateHours)) : ''; const value = event.currentTarget.value; if (value !== previous) save(event.currentTarget, { estimateHours: value === '' ? null : Number(value) }, previous); }} className={`${field} w-24`} />
              <span className="whitespace-nowrap text-slate-500">h{totalHours > 0 ? ` · subtareas suman ${totalHours} h` : ''}</span>
            </div>

            <label htmlFor="task-milestone" className="text-slate-500">Hito</label>
            {inheritedMilestone ? (
              <p id="task-milestone" className="py-2 text-slate-700">
                {milestones.find((milestone) => milestone.id === task.milestoneId)?.title || 'Sin hito'}
                <span className="block text-[11px] text-slate-500">{inheritedMilestone}</span>
              </p>
            ) : (
              <select key={`milestone-${task.milestoneId}`} id="task-milestone" defaultValue={task.milestoneId || ''} onChange={(event) => save(event.currentTarget, { milestoneId: event.target.value || null }, task.milestoneId || '')} className={field}>
                <option value="">Suelta (sin hito)</option>
                {milestones.map((milestone) => <option key={milestone.id} value={milestone.id}>{milestone.title}</option>)}
              </select>
            )}

            {usesSprints && <>
              <label htmlFor="task-sprint" className="text-slate-500">Sprint</label>
              <select id="task-sprint" defaultValue={task.sprint?.id || ''} onChange={(event) => save(event.currentTarget, { sprintId: event.target.value || null }, task.sprint?.id || '')} className={field}>
                <option value="">Sin sprint</option>
                {sprints.map((sprint) => <option key={sprint.id} value={sprint.id}>{sprint.name}</option>)}
              </select>
            </>}

            <label htmlFor="task-requirement" className="text-slate-500">Requerimiento</label>
            <select id="task-requirement" defaultValue={task.requirement?.id || ''} onChange={(event) => save(event.currentTarget, { requirementId: event.target.value || null }, task.requirement?.id || '')} className={field}>
              <option value="">Sin requerimiento</option>
              {requirements.map((requirement) => <option key={requirement.id} value={requirement.id}>{requirement.code ? `${requirement.code} · ` : ''}{requirement.title}</option>)}
            </select>
          </section>

          <label className="block text-xs font-semibold text-slate-700" key={`desc-${task.id}`}>
            Descripción
            <textarea
              defaultValue={task.description || ''}
              rows={4}
              placeholder="Qué hay que hacer, criterios de aceptación, enlaces…"
              onBlur={(event) => { const value = event.currentTarget.value.trim(); if (value !== (task.description || '')) save(event.currentTarget, { description: value || null }, task.description || ''); }}
              className={`${field} mt-1 py-2 font-normal leading-relaxed`}
            />
          </label>

          {/* Subtasks */}
          {!isSubtask && (
            <section aria-labelledby="subtasks-title" className="border-t border-slate-100 pt-4">
              <div className="mb-2 flex items-center justify-between">
                <h3 id="subtasks-title" className="text-xs font-bold text-slate-900">Subtareas</h3>
                {task.subtasks.length > 0 && <span className="text-[11px] text-slate-500">{doneSubtasks.length} de {task.subtasks.length}{totalHours > 0 ? ` · ${hours(doneSubtasks)} de ${totalHours} h` : ''}</span>}
              </div>
              {task.subtasks.length > 0 && <div className="mb-2 h-1 overflow-hidden rounded-full bg-slate-100" aria-hidden="true"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.round((doneSubtasks.length / task.subtasks.length) * 100)}%` }} /></div>}
              <ul className="divide-y divide-slate-100">
                {task.subtasks.map((subtask) => {
                  const done = subtask.status === 'DONE';
                  return (
                    <li key={subtask.id} className="flex items-center gap-2.5 py-1.5 text-xs">
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={done}
                        aria-label={`Marcar ${subtask.title} como ${done ? 'por hacer' : 'terminada'}`}
                        disabled={pending}
                        onClick={() => perform(() => setTaskStatusAction(projectId, subtask.id, done ? 'TODO' : 'DONE'))}
                        className={`inline-flex size-4 shrink-0 items-center justify-center rounded border ${done ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-400 bg-card'} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600`}
                      >{done && <Check className="size-3" aria-hidden="true" />}</button>
                      <Link href={hrefFor(subtask.id)} scroll={false} className={`min-w-0 flex-1 truncate underline-offset-2 hover:underline ${done ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{subtask.title}</Link>
                      {!done && subtask.status !== 'TODO' && <span className="shrink-0 text-[10px] text-slate-500">{formatTaskStatus(subtask.status)}</span>}
                      {subtask.dueDate && <span className="shrink-0 text-[10px] text-slate-500">{formatCompactDate(subtask.dueDate)}</span>}
                      <Avatar person={subtask.assignedTo} size="size-5" />
                    </li>
                  );
                })}
              </ul>
              <form
                className="mt-2 flex flex-wrap items-center gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  const form = event.currentTarget;
                  const data = new FormData(form);
                  const title = String(data.get('title') || '').trim();
                  if (!title) return;
                  perform(async () => {
                    const result = await createTaskQuickAction(projectId, { title, parentId: task.id, assignedToId: String(data.get('assignedToId') || '') || null });
                    if (result.ok) { form.reset(); subtaskRef.current?.focus(); }
                    return result;
                  });
                }}
              >
                <label className="sr-only" htmlFor="subtask-title">Nueva subtarea</label>
                <input ref={subtaskRef} id="subtask-title" name="title" placeholder="Añadir subtarea · Enter para guardar" maxLength={200} className={`${field} min-w-0 flex-1`} />
                <label className="sr-only" htmlFor="subtask-assignee">Responsable de la subtarea</label>
                <select id="subtask-assignee" name="assignedToId" defaultValue={task.assignedTo?.id || ''} className={`${field} w-36`}>
                  <option value="">Sin responsable</option>
                  {workers.map((worker) => <option key={worker.id} value={worker.id}>{worker.name}</option>)}
                </select>
                <button type="submit" disabled={pending} className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-slate-200 bg-card px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"><CornerDownLeft className="size-3.5" aria-hidden="true" />Añadir</button>
              </form>
            </section>
          )}

          {/* Dependencies & evidence */}
          <section aria-label="Prerequisitos y evidencias" className="space-y-2 border-t border-slate-100 pt-4">
            {projectId && <TaskDependencyEditor projectId={projectId} task={task} tasks={tasks} />}
            {task.unlocks.length > 0 && <p className="flex flex-wrap items-center gap-1 text-[11px] text-slate-500"><Link2 className="size-3" aria-hidden="true" />Desbloquea: {task.unlocks.map((item) => <Link key={item.id} href={hrefFor(item.successor.id)} scroll={false} className="font-medium text-slate-700 underline-offset-2 hover:underline">{taskCode(item.successor.number)}</Link>)}</p>}
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" onClick={() => setEvidenceOpen(true)} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-card px-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50"><Camera className="size-3.5" aria-hidden="true" />Evidencias ({task.evidences?.length || 0})</button>
              <label className="inline-flex items-center gap-1.5 text-xs text-slate-600">
                <input type="checkbox" defaultChecked={Boolean(task.requiresEvidence)} disabled={pending} onChange={(event) => { const checked = event.currentTarget.checked; const input = event.currentTarget; perform(() => patchTaskAction(projectId, task.id, { requiresEvidence: checked }), checked ? 'Ahora necesita evidencia para terminar.' : 'Ya no necesita evidencia para terminar.', () => { input.checked = !checked; }); }} className="size-3.5 accent-current" />
                Requiere evidencia para terminar
              </label>
            </div>
            {task.requiresEvidence && !task.evidences?.length && status !== 'DONE' && <p className="text-[11px] text-amber-700">Agrega un enlace, una imagen o una nota antes de marcarla como terminada.</p>}
          </section>

          {/* Conversation */}
          <section aria-label="Conversación" className="border-t border-slate-100 pt-4">
            <div role="tablist" aria-label="Conversación y actividad" className="mb-3 flex gap-4 border-b border-slate-100 text-xs">
              {(['comments', 'activity'] as const).map((value) => (
                <button key={value} type="button" role="tab" id={`tab-${value}`} aria-controls={`panel-${value}`} aria-selected={tab === value} onClick={() => setTab(value)} className={`-mb-px border-b-2 pb-2 ${tab === value ? 'border-blue-600 font-semibold text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
                  {value === 'comments' ? `Comentarios (${task.comments.length})` : 'Actividad'}
                </button>
              ))}
            </div>
            {tab === 'comments' ? (
              <div role="tabpanel" id="panel-comments" aria-labelledby="tab-comments" className="space-y-3">
                {task.comments.length === 0 && <p className="text-xs text-slate-500">Todavía no hay comentarios. Pregunta, deja contexto o menciona con @nombre.</p>}
                {task.comments.map((comment) => (
                  <article key={comment.id} className="group flex gap-2.5 text-xs">
                    <Avatar person={comment.author} />
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2"><span className="font-semibold text-slate-900">{comment.author.name}</span><time dateTime={comment.createdAt} className="text-[11px] text-slate-500">{dateTime.format(new Date(comment.createdAt))}</time>
                        {(comment.author.id === currentUser.id || currentUser.role === 'ADMIN') && <button type="button" onClick={() => { if (window.confirm('¿Borrar este comentario?')) perform(() => deleteTaskCommentAction(projectId, task.id, comment.id)); }} className="ml-auto rounded p-1 text-slate-400 opacity-0 hover:bg-slate-100 hover:text-rose-600 focus-visible:opacity-100 group-hover:opacity-100" aria-label="Borrar comentario"><Trash2 className="size-3" /></button>}
                      </p>
                      <p className="mt-0.5 whitespace-pre-wrap break-words leading-relaxed text-slate-700"><CommentBody body={comment.body} /></p>
                    </div>
                  </article>
                ))}
                <form
                  className="space-y-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const body = commentRef.current?.value.trim();
                    if (!body) return;
                    perform(async () => {
                      const result = await addTaskCommentAction(projectId, task.id, body);
                      if (result.ok && commentRef.current) commentRef.current.value = '';
                      return result;
                    });
                  }}
                >
                  <label className="sr-only" htmlFor="task-comment">Nuevo comentario</label>
                  <textarea id="task-comment" ref={commentRef} rows={3} maxLength={5000} placeholder="Escribe un comentario. Usa @nombre para mencionar." onKeyDown={(event) => { if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) event.currentTarget.form?.requestSubmit(); }} className={`${field} py-2`} />
                  <div className="flex items-center justify-between"><span className="text-[10px] text-slate-400">Ctrl/⌘ + Enter para enviar</span><button type="submit" disabled={pending} className="min-h-9 rounded-lg bg-brand-button px-3 text-xs font-semibold text-white hover:bg-brand-hover disabled:opacity-60">Comentar</button></div>
                </form>
              </div>
            ) : (
              <ol role="tabpanel" id="panel-activity" aria-labelledby="tab-activity" className="space-y-2 text-xs">
                {task.activity.length === 0 && <li className="text-slate-500">Sin actividad registrada.</li>}
                {task.activity.map((entry) => (
                  <li key={entry.id} className="flex gap-2 text-slate-600">
                    <time dateTime={entry.createdAt} className="w-24 shrink-0 text-[11px] text-slate-400">{dateTime.format(new Date(entry.createdAt))}</time>
                    <span><b className="font-semibold text-slate-800">{entry.actor?.name || 'Sistema'}</b> · {entry.description || entry.action}</span>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <div className="flex justify-end border-t border-slate-100 pt-4">
            <button type="button" disabled={pending} onClick={() => { if (window.confirm(`¿Eliminar ${taskCode(task.number)}${task.subtasks.length ? ` y sus ${task.subtasks.length} subtareas` : ''}? No se puede deshacer.`)) perform(async () => { const result = await deleteTaskQuickAction(projectId, task.id); if (result.ok) close(); return result; }); }} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-medium text-rose-700 hover:bg-rose-50"><Trash2 className="size-3.5" aria-hidden="true" />Eliminar tarea</button>
          </div>
        </div>

        <EvidenceModal projectId={projectId || undefined} taskId={task.id} taskTitle={task.title} evidences={task.evidences || []} requiresEvidence={Boolean(task.requiresEvidence)} isOpen={evidenceOpen} onClose={() => setEvidenceOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
