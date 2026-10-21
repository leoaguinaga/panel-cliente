'use client';

import { useState, useTransition } from 'react';
import {
  createRequirementAction,
  setRequirementCriteriaAction,
  deleteRequirementAction,
  createTaskAction,
} from '@/src/modules/projects/server/actions';
import { setRequirementMilestone } from '@/src/modules/projects/server/milestone-actions';
import { formatTaskStatus } from '@/lib/formatters';
import { Button } from '@/components/ui/button';
import {
  Plus,
  Trash2,
  ChevronRight,
  Search,
  FileCheck2,
} from 'lucide-react';

export type RequirementItem = {
  id: string;
  projectId?: string;
  code: string | null;
  title: string;
  description?: string | null;
  acceptanceCriteria?: Array<{ id: string; text: string; checked: boolean }>;
  priority?: string;
  milestoneId?: string | null;
  status?: 'pending' | 'in_progress' | 'done';
  tasks?: Array<{ id: string; title: string; status: string; priority: string }>;
};

type Sprint = { id: string; name: string };
type Milestone = { id: string; title: string };

const REQUIREMENT_STATUS = {
  pending: { label: 'Pendiente', tone: 'bg-slate-50 text-slate-600 border-slate-200' },
  in_progress: { label: 'En curso', tone: 'bg-blue-50 text-blue-700 border-blue-200' },
  done: { label: 'Cumplido', tone: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
} as const;
type Worker = { id: string; name: string };

export function RequirementManager({
  projectId,
  requirements = [],
  sprints = [],
  milestones = [],
  usesSprints = false,
  workers = [],
}: {
  projectId: string;
  requirements: RequirementItem[];
  sprints?: Sprint[];
  milestones?: Milestone[];
  usesSprints?: boolean;
  workers?: Worker[];
}) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const statusOf = (req: RequirementItem) => req.status ?? 'pending';
  const matches = (req: RequirementItem) =>
    (statusFilter === 'all' || statusOf(req) === statusFilter) &&
    [req.code, req.title, req.description, ...(req.tasks ?? []).map((task) => task.title)]
      .join(' ').toLocaleLowerCase().includes(search.trim().toLocaleLowerCase());
  const visibleRequirements = requirements.filter(matches);
  const allCollapsed = visibleRequirements.length > 0 && visibleRequirements.every((req) => collapsed.has(req.id));
  const toggleRequirement = (id: string) => setCollapsed((previous) => {
    const next = new Set(previous);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const [newReqOpen, setNewReqOpen] = useState(false);
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [criteria, setCriteria] = useState<Array<{ id: string; text: string; checked: boolean }>>([]);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [priority, setPriority] = useState('MEDIUM');
  const [milestoneId, setMilestoneId] = useState('');
  const [moveError, setMoveError] = useState<string | null>(null);

  // Breakdown task modal
  const [breakdownReq, setBreakdownReq] = useState<RequirementItem | null>(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskSprintId, setTaskSprintId] = useState(sprints[0]?.id || '');
  const [taskWorkerId, setTaskWorkerId] = useState('');

  const [isPending, startTransition] = useTransition();

  const handleCreateRequirement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const formData = new FormData();
    formData.append('code', code.trim());
    formData.append('title', title.trim());
    formData.append('description', description.trim());
    formData.append('acceptanceCriteria', JSON.stringify(criteria.filter((item) => item.text.trim()).map((item) => ({ ...item, text: item.text.trim() }))));
    formData.append('priority', priority || 'MEDIUM');
    if (milestoneId) formData.append('milestoneId', milestoneId);

    startTransition(async () => {
      setSaveError(null);
      try {
        await createRequirementAction(projectId, formData);
        setCode('');
        setTitle('');
        setDescription('');
        setCriteria([]);
        setNewReqOpen(false);
      } catch { setSaveError("No se pudo guardar el requerimiento. Inténtalo de nuevo."); }
    });
  };

  const handleBreakdownTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!breakdownReq || !taskTitle.trim()) return;

    const formData = new FormData();
    formData.append('title', taskTitle.trim());
    formData.append('requirementId', breakdownReq.id);
    if (usesSprints && taskSprintId) formData.append('sprintId', taskSprintId);
    if (taskWorkerId) formData.append('assignedToId', taskWorkerId);
    formData.append('priority', breakdownReq.priority || 'MEDIUM');

    startTransition(async () => {
      await createTaskAction(projectId, formData);
      setTaskTitle('');
      setBreakdownReq(null);
      window.location.reload();
    });
  };

  const handleMove = (reqId: string, next: string) => {
    setMoveError(null);
    startTransition(async () => {
      const result = await setRequirementMilestone(projectId, reqId, next || null);
      if (!result.ok) setMoveError(result.error);
    });
  };

  // Agrupados por hito, en el orden de los hitos; al final, los que no tienen hito
  const groups = [
    ...milestones.map((milestone) => ({ id: milestone.id, title: milestone.title, items: visibleRequirements.filter((req) => req.milestoneId === milestone.id) })),
    { id: '', title: 'Sin hito', items: visibleRequirements.filter((req) => !req.milestoneId || !milestones.some((milestone) => milestone.id === req.milestoneId)) },
  ].filter((group) => group.items.length);

  const handleDelete = (reqId: string) => {
    if (!confirm('¿Seguro que deseas eliminar este Requerimiento?')) return;
    startTransition(async () => {
      await deleteRequirementAction(projectId, reqId);
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Lo acordado con el cliente y las tareas para cumplirlo.</p>
        <Button onClick={() => setNewReqOpen(true)} size="sm" className="gap-1.5">
          <Plus className="size-4" />Nuevo requerimiento
        </Button>
      </div>
      {requirements.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex max-w-full flex-wrap rounded-lg border bg-muted/30 p-1" aria-label="Filtrar por estado">
            {(['all', 'pending', 'in_progress', 'done'] as const).map((status) => (
              <button key={status} type="button" aria-pressed={statusFilter === status}
                onClick={() => setStatusFilter(status)}
                className={`rounded-md px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${statusFilter === status ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                {status === 'all' ? 'Todos' : status === 'pending' ? 'Pendientes' : status === 'done' ? 'Cumplidos' : 'En curso'}
                <span className="ml-1.5 tabular-nums text-muted-foreground">{requirements.filter((req) => status === 'all' || statusOf(req) === status).length}</span>
              </button>
            ))}
          </div>
          <label className="flex min-w-48 flex-1 items-center gap-2 rounded-lg border px-3 py-2 focus-within:ring-2 focus-within:ring-ring">
            <Search aria-hidden className="size-4 shrink-0 text-muted-foreground" />
            <span className="sr-only">Buscar requerimiento o tarea</span>
            <input value={search} onChange={(event) => setSearch(event.target.value)} type="search"
              placeholder="Buscar requerimiento o tarea…" className="w-full min-w-0 bg-transparent text-sm outline-none" />
          </label>
          <Button variant="outline" size="sm" disabled={!visibleRequirements.length} onClick={() => setCollapsed((previous) => {
            const next = new Set(previous);
            visibleRequirements.forEach((req) => { if (allCollapsed) next.delete(req.id); else next.add(req.id); });
            return next;
          })}>{allCollapsed ? 'Expandir tareas' : 'Contraer tareas'}</Button>
        </div>
      )}
      {moveError && <p role="alert" className="text-sm text-destructive">{moveError}</p>}

      {requirements.length === 0 ? (
        <div className="p-10 border rounded-xl bg-card text-center space-y-3">
          <FileCheck2 className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="text-sm font-semibold text-slate-800">No hay Requerimientos registrados</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Registra los requerimientos del cliente para luego desglosarlos en tareas del Sprint y recopilar evidencias.
          </p>
          <Button onClick={() => setNewReqOpen(true)} size="sm">
            Registrar REQ-01
          </Button>
        </div>
      ) : (
        <div>
          <div className="overflow-hidden rounded-xl border bg-card">
            <div className="hidden grid-cols-[minmax(0,1fr)_110px_180px_90px_32px] gap-4 bg-muted/40 px-5 py-3 text-[11px] font-medium uppercase tracking-wide text-muted-foreground lg:grid" aria-hidden="true">
              <span>Requerimiento</span><span>Estado</span><span>Hito</span><span>Tareas</span><span />
            </div>
            {!groups.length && <div className="p-8 text-center text-sm text-muted-foreground">No hay coincidencias. Prueba con otro término o estado.</div>}
            {groups.map((group) => (
              <section key={group.id || 'none'} aria-label={group.title}>
                <div className="flex flex-wrap items-center justify-between gap-2 border-t bg-muted/20 px-5 py-3 text-xs">
                  <h3 className="font-medium">{group.title}</h3>
                  <span className="text-muted-foreground">{group.items.length} requerimientos · {group.items.filter((req) => statusOf(req) === 'done').length} cumplidos</span>
                </div>
                {group.items.map((req) => {
                  const reqTasks = req.tasks ?? [];
                  const doneTasks = reqTasks.filter((task) => task.status === 'DONE').length;
                  const expanded = !collapsed.has(req.id);
                  const status = statusOf(req);
                  return (
                    <div key={req.id} className="border-t">
                      <div className="grid grid-cols-[minmax(0,1fr)_auto_32px] items-center gap-3 px-4 py-4 lg:grid-cols-[minmax(0,1fr)_110px_180px_90px_32px] lg:gap-4 lg:px-5">
                        <button type="button" className="flex min-w-0 items-center gap-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          aria-expanded={expanded} aria-controls={`requirement-details-${req.id}`} onClick={() => toggleRequirement(req.id)}>
                          <ChevronRight aria-hidden className={`size-4 shrink-0 text-muted-foreground transition-transform motion-reduce:transition-none ${expanded ? 'rotate-90' : ''}`} />
                          <span className="shrink-0 rounded bg-violet-500/15 px-1.5 py-0.5 text-[11px] font-semibold text-violet-700">{req.code || 'REQ'}</span>
                          <span className="min-w-0 break-words text-sm font-medium">{req.title}</span>
                        </button>
                        <span className="inline-flex items-center gap-2 text-xs">
                          <span aria-hidden className={`size-1.5 shrink-0 rounded-full ${status === 'done' ? 'bg-emerald-500' : status === 'in_progress' ? 'bg-sky-400' : 'bg-muted-foreground'}`} />
                          {REQUIREMENT_STATUS[status].label}
                        </span>
                        <select aria-label={`Hito de ${req.title}`} value={req.milestoneId || ''} disabled={isPending}
                          onChange={(event) => handleMove(req.id, event.target.value)}
                          className="col-start-1 row-start-2 min-w-0 max-w-full lg:col-auto lg:row-auto rounded-md border border-transparent bg-transparent px-2 py-1.5 text-xs text-muted-foreground hover:border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50">
                          <option value="">Sin hito</option>
                          {milestones.map((milestone) => <option key={milestone.id} value={milestone.id}>{milestone.title}</option>)}
                        </select>
                        <span className="col-start-2 row-start-2 text-xs tabular-nums text-muted-foreground lg:col-auto lg:row-auto">{reqTasks.length ? `${doneTasks}/${reqTasks.length} tareas` : 'Sin tareas'}</span>
                        <Button type="button" variant="ghost" size="icon" disabled={isPending} aria-label={`Eliminar ${req.title}`} onClick={() => handleDelete(req.id)} className="col-start-3 row-start-1 size-8 justify-self-end text-muted-foreground hover:text-destructive lg:col-auto lg:row-auto">
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                      <div id={`requirement-details-${req.id}`} hidden={!expanded} className="space-y-3 pb-4 pl-10 pr-4 lg:pl-14 lg:pr-5">
                        {req.description && <p className="max-w-prose whitespace-pre-wrap break-words text-xs text-muted-foreground">{req.description}</p>}
                {!!req.acceptanceCriteria?.length && (
                  <fieldset className="space-y-2">
                    <legend className="mb-2 text-xs font-semibold">Criterios de aceptación</legend>
                    {req.acceptanceCriteria.map((criterion) => (
                      <label key={criterion.id} className="flex items-start gap-2 text-xs cursor-pointer">
                        <input type="checkbox" checked={criterion.checked} disabled={isPending}
                          className="mt-0.5 accent-primary"
                          onChange={(event) => {
                            const checked = event.target.checked;
                            startTransition(async () => {
                              try {
                                await setRequirementCriteriaAction(projectId, req.id, req.acceptanceCriteria!.map((item) => item.id === criterion.id ? { ...item, checked } : item));
                              } catch { setMoveError('No se pudo actualizar el criterio. Inténtalo de nuevo.'); }
                            });
                          }} />
                        <span className={`break-words min-w-0 ${criterion.checked ? 'line-through text-muted-foreground' : ''}`}>{criterion.text}</span>
                      </label>
                    ))}
                  </fieldset>
                )}


                        {reqTasks.length > 0 ? (
                          <ol className="border-l border-border/70">
                            {reqTasks.map((task) => (
                              <li key={task.id} className="relative grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 py-2.5 pl-5 text-xs before:absolute before:-left-[3.5px] before:size-1.5 before:rounded-full before:bg-muted-foreground">
                                <span className={`min-w-0 break-words ${task.status === 'DONE' ? 'text-muted-foreground' : ''}`}>{task.title}</span>
                                <span className="text-muted-foreground">{formatTaskStatus(task.status)}</span>
                              </li>
                            ))}
                          </ol>
                        ) : <p className="text-xs text-muted-foreground">Todavía no hay tareas para este requerimiento.</p>}
                        <Button type="button" variant="ghost" size="sm" disabled={isPending} className="h-8 gap-1 px-2 text-xs text-[#ffab96] hover:text-[#ffc8ba]" onClick={() => { setBreakdownReq(req); setTaskTitle(''); }}>
                          <Plus className="size-3.5" />Añadir tarea
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </section>
            ))}
          </div>
          <p className="mt-4 text-xs text-muted-foreground" role="status">{visibleRequirements.length} de {requirements.length} requerimientos</p>
        </div>
      )}

      {/* Modal Nuevo Requerimiento */}
      {newReqOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md max-h-[90dvh] overflow-y-auto rounded-xl border bg-card p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-sm text-slate-900">Registrar Requerimiento</h3>
              <button
                type="button"
                onClick={() => setNewReqOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRequirement} className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Código</label>
                  <input
                    placeholder="REQ-01"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full rounded-md border bg-slate-50 px-2.5 py-1.5 text-xs outline-none focus:bg-card focus:ring-2 focus:ring-primary uppercase"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Prioridad</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full rounded-md border bg-slate-50 px-2.5 py-1.5 text-xs outline-none focus:bg-card focus:ring-2 focus:ring-primary"
                  >
                    <option value="LOW">Baja</option>
                    <option value="MEDIUM">Media</option>
                    <option value="HIGH">Alta</option>
                    <option value="URGENT">Urgente</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="new-req-milestone" className="block text-xs font-semibold text-slate-700 mb-1">Hito</label>
                <select
                  id="new-req-milestone"
                  value={milestoneId}
                  onChange={(e) => setMilestoneId(e.target.value)}
                  className="w-full rounded-md border bg-slate-50 px-2.5 py-1.5 text-xs outline-none focus:bg-card focus:ring-2 focus:ring-primary"
                >
                  <option value="">Sin hito por ahora</option>
                  {milestones.map((milestone) => <option key={milestone.id} value={milestone.id}>{milestone.title}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Título del Requerimiento</label>
                <input
                  required
                  placeholder="Ej. Integración de Pasarela de Pagos (Stripe / MercadoPago)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-md border bg-slate-50 px-3 py-2 text-xs outline-none focus:bg-card focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label htmlFor="req-description" className="block text-xs font-semibold text-slate-700 mb-1">Descripción</label>
                <textarea
                  id="req-description"
                  rows={3}
                  placeholder="Especificaciones o alcance acordado con el cliente..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-md border bg-slate-50 px-3 py-2 text-xs outline-none focus:bg-card focus:ring-2 focus:ring-primary"
                />
              </div>

              <fieldset className="space-y-2">
                <legend className="text-xs font-semibold text-slate-700">Criterios de aceptación</legend>
                <p className="text-xs text-muted-foreground">Agrega una condición verificable por cada elemento.</p>
                {criteria.map((criterion, index) => (
                  <div key={criterion.id} className="flex items-center gap-2">
                    <input type="checkbox" aria-label={`Criterio ${index + 1} cumplido`} checked={criterion.checked} className="accent-primary"
                      onChange={(event) => setCriteria(criteria.map((item) => item.id === criterion.id ? { ...item, checked: event.target.checked } : item))} />
                    <input aria-label={`Criterio de aceptación ${index + 1}`} required maxLength={2000} value={criterion.text}
                      placeholder="Ej. El cliente recibe un correo de confirmación"
                      onChange={(event) => setCriteria(criteria.map((item) => item.id === criterion.id ? { ...item, text: event.target.value } : item))}
                      className="min-w-0 flex-1 rounded-md border bg-slate-50 px-3 py-2 text-xs focus:ring-2 focus:ring-primary" />
                    <button type="button" aria-label={`Quitar criterio ${index + 1}`} className="p-2 text-muted-foreground hover:text-destructive" onClick={() => setCriteria(criteria.filter((item) => item.id !== criterion.id))}><Trash2 className="size-4" /></button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" disabled={criteria.length >= 100} onClick={() => setCriteria([...criteria, { id: crypto.randomUUID(), text: '', checked: false }])}><Plus className="size-4" /> Agregar criterio</Button>
              </fieldset>
              {saveError && <p role="alert" className="text-xs text-destructive">{saveError}</p>}

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline" size="sm" onClick={() => setNewReqOpen(false)}>
                  Cancelar
                </Button>
                <Button disabled={isPending} type="submit" size="sm" className="bg-brand-button hover:bg-brand-hover text-white">
                  {isPending ? 'Guardando...' : 'Guardar Requerimiento'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Desglosar en Tarea */}
      {breakdownReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-2">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Desglosar Requerimiento en Tarea</h3>
                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                  [{breakdownReq.code || 'REQ'}] {breakdownReq.title}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setBreakdownReq(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleBreakdownTask} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Título de la Tarea</label>
                <input
                  required
                  placeholder="Ej. Crear Webhook y endpoint de confirmación"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full rounded-md border bg-slate-50 px-3 py-2 text-xs outline-none focus:bg-card focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className={`grid gap-2 ${usesSprints ? 'grid-cols-2' : ''}`}>
                {usesSprints && <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Sprint</label>
                  <select
                    value={taskSprintId}
                    onChange={(e) => setTaskSprintId(e.target.value)}
                    className="w-full rounded-md border bg-slate-50 px-2.5 py-1.5 text-xs outline-none focus:bg-card focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Sin Sprint (Backlog)</option>
                    {sprints.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Responsable</label>
                  <select
                    value={taskWorkerId}
                    onChange={(e) => setTaskWorkerId(e.target.value)}
                    className="w-full rounded-md border bg-slate-50 px-2.5 py-1.5 text-xs outline-none focus:bg-card focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Sin asignar</option>
                    {workers.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline" size="sm" onClick={() => setBreakdownReq(null)}>
                  Cancelar
                </Button>
                <Button disabled={isPending} type="submit" size="sm" className="bg-brand-button hover:bg-brand-hover text-white">
                  {isPending ? 'Creando Tarea...' : 'Crear Tarea'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
