'use client';

import { useEffect, useState, useTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import { updateTaskStatusAction, updateTaskDetailsAction, createTaskAction } from '@/src/modules/projects/server/actions';
import { EvidenceModal, TaskEvidenceItem } from '../agile/EvidenceUploader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useHorizontalDragScroll } from '@/hooks/use-horizontal-drag-scroll';
import type { ProjectRequirement, ProjectSprint, ProjectTask, ProjectWorker } from '@/src/modules/projects/types';
import { TaskDependencyEditor } from '@/components/projects/TaskDependencyEditor';
import { formatCompactDate, formatProjectPriority, formatTaskStatus } from '@/lib/formatters';
import {
  Camera,
  Calendar,
  Plus,
  Filter,
  Layers,
  Sparkles,
  CheckCircle2,
  GripVertical,
} from 'lucide-react';

export type TaskItem = Omit<ProjectTask, 'evidences'> & { evidences?: TaskEvidenceItem[] };

const COLUMNS: Array<{
  id: TaskItem['status'];
  title: string;
  dotColor: string;
  columnBg: string;
  headerColor: string;
}> = [
  {
    id: 'TODO',
    title: 'Por hacer',
    dotColor: 'bg-indigo-600',
    columnBg: 'bg-[#F6F7FB] border-slate-200/70',
    headerColor: 'text-slate-700',
  },
  {
    id: 'IN_PROGRESS',
    title: 'En progreso',
    dotColor: 'bg-blue-600',
    columnBg: 'bg-[#F0F6FF] border-blue-100/70',
    headerColor: 'text-slate-700',
  },
  {
    id: 'REVIEW',
    title: 'En revisión',
    dotColor: 'bg-amber-500',
    columnBg: 'bg-[#FFF9F2] border-amber-100/70',
    headerColor: 'text-slate-700',
  },
  {
    id: 'BLOCKED',
    title: 'Bloqueada',
    dotColor: 'bg-rose-500',
    columnBg: 'bg-[#FFF2F4] border-rose-100/70',
    headerColor: 'text-slate-700',
  },
  {
    id: 'DONE',
    title: 'Terminada',
    dotColor: 'bg-emerald-500',
    columnBg: 'bg-[#F2FAF5] border-emerald-100/70',
    headerColor: 'text-slate-700',
  },
];

export function TaskKanban({
  projectId,
  initialTasks,
  sprints = [],
  requirements = [],
  workers = [],
}: {
  projectId: string;
  initialTasks: TaskItem[];
  sprints?: ProjectSprint[];
  requirements?: ProjectRequirement[];
  workers?: ProjectWorker[];
}) {
  const [tasks, setTasks] = useState<TaskItem[]>(initialTasks);
  const [syncedTasks, setSyncedTasks] = useState(initialTasks);
  if (syncedTasks !== initialTasks) {
    setSyncedTasks(initialTasks);
    setTasks(initialTasks);
  }
  const focusedTaskId = useSearchParams().get('task');
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const { containerRef, headerProps, onKeyDown: handleBoardKeyDown } = useHorizontalDragScroll();

  // Filters
  const [selectedSprintId, setSelectedSprintId] = useState<string>('ALL');
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>('ALL');

  // Evidence Modal State
  const [evidenceModalTask, setEvidenceModalTask] = useState<TaskItem | null>(null);

  // New Task Quick Modal
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [newTaskStatus, setNewTaskStatus] = useState<TaskItem['status']>('TODO');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('MEDIUM');
  const [newTaskSprintId, setNewTaskSprintId] = useState(sprints.find((s) => s.status === 'ACTIVE')?.id || '');
  const [newTaskReqId, setNewTaskReqId] = useState('');
  const [newTaskWorkerId, setNewTaskWorkerId] = useState('');
  const [newTaskStartDate, setNewTaskStartDate] = useState('');
  const [newTaskEndDate, setNewTaskEndDate] = useState('');

  useEffect(() => {
    if (!focusedTaskId) return;
    const card = document.getElementById(`task-${focusedTaskId}`);
    if (!card) return;
    card.scrollIntoView({ block: 'center', inline: 'center', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    card.focus({ preventScroll: true });
  }, [focusedTaskId]);

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    setDraggedTaskId(id);
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    if (dragOverColumn !== columnId) setDragOverColumn(columnId);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, targetStatus: TaskItem['status']) => {
    e.preventDefault();
    setDragOverColumn(null);
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (!taskId) return;

    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === targetStatus) {
      setDraggedTaskId(null);
      return;
    }

    // Optimistic UI update
    setTasks((prev) =>
      prev.map((item) => (item.id === taskId ? { ...item, status: targetStatus } : item))
    );
    setDraggedTaskId(null);

    // If dropped into REVIEW, prompt screenshot evidence modal
    if (targetStatus === 'REVIEW') {
      setEvidenceModalTask({ ...task, status: 'REVIEW' });
    }

    // Server update
    startTransition(async () => {
      try {
        await updateTaskStatusAction(taskId, projectId, targetStatus);
      } catch {
        setTasks(initialTasks);
      }
    });
  };

  const moveTask = (task: TaskItem, targetStatus: TaskItem['status']) => {
    if (task.status === targetStatus) return;
    const previous = tasks;
    setTasks((items) => items.map((item) => item.id === task.id ? { ...item, status: targetStatus } : item));
    startTransition(async () => {
      try { await updateTaskStatusAction(task.id, projectId, targetStatus); }
      catch { setTasks(previous); }
    });
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const formData = new FormData();
    formData.append('title', newTaskTitle.trim());
    formData.append('priority', newTaskPriority);
    formData.append('status', newTaskStatus);
    if (newTaskSprintId) formData.append('sprintId', newTaskSprintId);
    if (newTaskReqId) formData.append('requirementId', newTaskReqId);
    if (newTaskWorkerId) formData.append('assignedToId', newTaskWorkerId);
    if (newTaskStartDate) formData.append('plannedStartDate', newTaskStartDate);
    if (newTaskEndDate) formData.append('plannedEndDate', newTaskEndDate);

    startTransition(async () => {
      await createTaskAction(projectId, formData);
      setNewTaskTitle('');
      setNewTaskOpen(false);
    });
  };

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    if (selectedSprintId === 'BACKLOG' && t.sprint?.id) return false;
    if (selectedSprintId !== 'ALL' && selectedSprintId !== 'BACKLOG' && t.sprint?.id !== selectedSprintId) return false;
    if (selectedWorkerId !== 'ALL' && t.assignedTo?.id !== selectedWorkerId) return false;
    return true;
  });

  const getPriorityPill = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return (
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-100">
            {formatProjectPriority('URGENT')}
          </span>
        );
      case 'HIGH':
        return (
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100">
            {formatProjectPriority('HIGH')}
          </span>
        );
      case 'LOW':
        return (
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-sky-50 text-sky-600 border border-sky-100">
            {formatProjectPriority('LOW')}
          </span>
        );
      default:
        return (
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-100">
            {formatProjectPriority('MEDIUM')}
          </span>
        );
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'UN';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-3">
      {/* Filters & Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mr-1">
            <Filter className="w-3.5 h-3.5" />
            Filtros:
          </div>

          {/* Sprint selector */}
          <select
            value={selectedSprintId}
            onChange={(e) => setSelectedSprintId(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-1.5 text-xs font-medium text-slate-700 outline-none focus:ring-2 focus:ring-primary focus:bg-white"
          >
            <option value="ALL">Todos los Sprints ({tasks.length})</option>
            {sprints.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} {s.status === 'ACTIVE' ? '★ (Activo)' : ''}
              </option>
            ))}
            <option value="BACKLOG">Backlog (Sin Sprint)</option>
          </select>

          {/* Worker selector */}
          <select
            value={selectedWorkerId}
            onChange={(e) => setSelectedWorkerId(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-1.5 text-xs font-medium text-slate-700 outline-none focus:ring-2 focus:ring-primary focus:bg-white"
          >
            <option value="ALL">Todos los responsables</option>
            {workers.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}{w.role === 'ADMIN' ? ' (Administrador)' : ''}
              </option>
            ))}
          </select>
        </div>

        <Button
          onClick={() => {
            setNewTaskStatus('TODO');
            setNewTaskOpen(true);
          }}
          size="sm"
          className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5 shadow-xs font-medium px-3.5"
        >
          <Plus className="w-3.5 h-3.5" />
          Nueva Tarea
        </Button>
      </div>

      {/* Board Columns: Natural standard width with horizontal scroll and Grip scroll */}
      <div
        ref={containerRef}
        className="flex gap-4 overflow-x-auto overflow-y-hidden scroll-smooth pb-6 pt-1 select-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ msOverflowStyle: 'none' }}
        tabIndex={0}
        aria-label="Estados de las tareas. Usa las flechas izquierda y derecha para desplazarte."
        onKeyDown={handleBoardKeyDown}
      >
        {COLUMNS.map((col) => {
          const colTasks = filteredTasks.filter((t) => t.status === col.id);
          const isOver = dragOverColumn === col.id;

          return (
            <div
              key={col.id}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col.id)}
              className={`shrink-0 w-80 rounded-2xl border p-4 flex flex-col min-h-[640px] transition-all ${
                col.columnBg
              } ${isOver ? 'ring-2 ring-blue-500/80 ring-offset-2 bg-white/95' : ''}`}
            >
              {/* Column Header */}
              <div {...headerProps} className="flex items-center justify-between px-1 py-1 mb-2 cursor-grab active:cursor-grabbing touch-pan-y select-none" aria-label={`Arrastra para desplazarte desde ${col.title}`}>
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${col.dotColor}`} />
                  <h3 className={`font-semibold text-xs truncate ${col.headerColor}`}>
                    {col.title}
                  </h3>
                  <span className="text-xs font-normal text-slate-400 shrink-0">
                    ({colTasks.length})
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <span className="text-slate-400 p-1" aria-hidden="true">
                    <GripVertical className="size-4" />
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      setNewTaskStatus(col.id);
                      setNewTaskOpen(true);
                    }}
                    className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-black/5 transition-colors"
                    title="Añadir tarea a esta columna"
                  >
                    <Plus className="size-3.5" />
                  </button>
                </div>
              </div>

              {/* Cards Container */}
              <div className="flex-1 space-y-3 overflow-y-auto pr-0.5">
                {colTasks.length === 0 ? (
                  <div className="h-32 border border-dashed border-slate-300/70 rounded-xl flex flex-col items-center justify-center text-center p-3 text-xs text-slate-400">
                    Arrastra tareas aquí
                  </div>
                ) : (
                  colTasks.map((task) => {
                    const hasUnresolvedDependencies = Boolean(task.blockedBy?.some((dependency) => dependency.predecessor.status !== 'DONE'));

                    return (
                      <div
                        key={task.id}
                        id={`task-${task.id}`}
                        tabIndex={-1}
                        aria-current={focusedTaskId === task.id ? 'true' : undefined}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task.id)}
                        className={`group relative rounded-xl bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-md transition-all cursor-grab active:cursor-grabbing border border-slate-100 space-y-3 ${
                          draggedTaskId === task.id ? 'opacity-40 scale-95' : ''
                        } ${focusedTaskId === task.id ? 'ring-2 ring-blue-600 ring-offset-2' : ''} focus-visible:outline-none`}
                      >
                        {/* Top row: Priority Pill, 6-dots handle & Optional Req Tag + Menu */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-slate-300 group-hover:text-slate-400 transition-colors shrink-0">
                              <GripVertical className="size-3.5" />
                            </span>
                            {getPriorityPill(task.priority)}

                            {task.requirement && (
                              <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 border border-purple-100 px-1.5 py-0.5 rounded-full truncate">
                                {task.requirement.code || 'REQ'}
                              </span>
                            )}
                          </div>
                        </div>

                        <label className="block text-[11px] font-medium text-slate-500">Mover a
                          <select value={task.status} onPointerDown={(event) => event.stopPropagation()} onDragStart={(event) => event.preventDefault()} onChange={(event) => moveTask(task, event.target.value as TaskItem['status'])} className="mt-1 min-h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-2 text-xs text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
                            {COLUMNS.map((status) => <option key={status.id} value={status.id} disabled={hasUnresolvedDependencies && !['TODO', 'BLOCKED'].includes(status.id)}>{status.title}</option>)}
                          </select>
                        </label>

                        <details onPointerDown={(event) => event.stopPropagation()} onDragStart={(event) => { event.preventDefault(); event.stopPropagation(); }} className="rounded-lg border border-slate-100 bg-slate-50/70 p-2">
                          <summary className="cursor-pointer text-[11px] font-semibold text-slate-600">Planificación</summary>
                          <form action={updateTaskDetailsAction.bind(null, task.id, projectId)} className="mt-2 grid grid-cols-2 gap-2">
                            <label className="text-[10px] font-medium text-slate-500">Inicio<input name="plannedStartDate" type="date" defaultValue={task.plannedStartDate?.slice(0, 10) || ''} className="mt-1 min-h-9 w-full rounded-md border bg-white px-2 text-[11px]" /></label>
                            <label className="text-[10px] font-medium text-slate-500">Fin<input name="plannedEndDate" type="date" defaultValue={task.plannedEndDate?.slice(0, 10) || ''} className="mt-1 min-h-9 w-full rounded-md border bg-white px-2 text-[11px]" /></label>
                            <input type="hidden" name="title" value={task.title} />
                            <input type="hidden" name="description" value={task.description || ''} />
                            <input type="hidden" name="priority" value={task.priority} />
                            <input type="hidden" name="assignedToId" value={task.assignedTo?.id || ''} />
                            <input type="hidden" name="sprintId" value={task.sprint?.id || ''} />
                            <input type="hidden" name="requirementId" value={task.requirement?.id || ''} />
                            <input type="hidden" name="dueDate" value={task.dueDate?.slice(0, 10) || ''} />
                            <button className="col-span-2 min-h-9 rounded-md border bg-white text-[11px] font-semibold text-slate-700">Guardar fechas</button>
                          </form>
                        </details>

                        <TaskDependencyEditor projectId={projectId} task={task} tasks={tasks} />

                        {/* Title */}
                        <h4
                          className={`text-[13px] font-semibold text-slate-800 leading-snug line-clamp-2 ${
                            task.status === 'DONE' ? 'line-through text-slate-400' : ''
                          }`}
                        >
                          {task.title}
                        </h4>

                        {/* Bottom Row: Due date, evidence & assignee */}
                        <div className="pt-2 border-t border-slate-100/80 flex items-center justify-between gap-2 text-xs text-slate-400">
                          <div className="flex items-center gap-2 min-w-0">
                            {(() => {
                              const due = task.dueDate || task.plannedEndDate;
                              if (!due) return null;
                              const overdue = task.status !== 'DONE' && new Date(due).getTime() < new Date().setHours(0, 0, 0, 0);
                              return (
                                <span className={`inline-flex items-center gap-1 text-[11px] ${overdue ? 'font-semibold text-rose-700' : 'text-slate-500'}`}>
                                  <Calendar className="size-3.5" aria-hidden="true" />
                                  {overdue ? 'Venció ' : 'Vence '}{formatCompactDate(due)}
                                </span>
                              );
                            })()}
                            <button
                              type="button"
                              onClick={() => setEvidenceModalTask(task)}
                              className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md transition-colors ${
                                task.evidences && task.evidences.length > 0
                                  ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 font-semibold'
                                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                              }`}
                              aria-label={`Evidencias de ${task.title}: ${task.evidences?.length || 0}`}
                              title="Subir o ver capturas de evidencia"
                            >
                              <Camera className="size-3" aria-hidden="true" />
                              <span>{task.evidences?.length || 0}</span>
                            </button>
                          </div>

                          {/* Avatar Circle */}
                          <div className="flex items-center -space-x-1.5 overflow-hidden">
                            {task.assignedTo ? (
                              <div
                                className="w-6 h-6 rounded-full bg-slate-700 border-2 border-white flex items-center justify-center text-[10px] font-bold text-white shadow-xs"
                                title={task.assignedTo.name}
                                aria-label={`Responsable: ${task.assignedTo.name}`}
                              >
                                {getInitials(task.assignedTo.name)}
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-400">Sin responsable</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick New Task Modal */}
      {newTaskOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border bg-white p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Plus className="size-4 text-blue-600" />
                Nueva tarea · {formatTaskStatus(newTaskStatus)}
              </h3>
              <button
                type="button"
                onClick={() => setNewTaskOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Título de la tarea
                </label>
                <input
                  required
                  placeholder="Ej. Wireframing the Homepage Layout"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2 text-xs outline-none focus:bg-white focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Sprint
                  </label>
                  <select
                    value={newTaskSprintId}
                    onChange={(e) => setNewTaskSprintId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-1.5 text-xs outline-none focus:bg-white focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="">Sin Sprint (Backlog)</option>
                    {sprints.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Prioridad
                  </label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-1.5 text-xs outline-none focus:bg-white focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="LOW">Baja</option>
                    <option value="MEDIUM">Media</option>
                    <option value="HIGH">Alta</option>
                    <option value="URGENT">Urgente</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <label className="block text-xs font-semibold text-slate-700">Inicio planificado<input type="date" value={newTaskStartDate} onChange={(e) => setNewTaskStartDate(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-600" /></label>
                <label className="block text-xs font-semibold text-slate-700">Fin planificado<input type="date" min={newTaskStartDate || undefined} value={newTaskEndDate} onChange={(e) => setNewTaskEndDate(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-600" /></label>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Requerimiento
                  </label>
                  <select
                    value={newTaskReqId}
                    onChange={(e) => setNewTaskReqId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-1.5 text-xs outline-none focus:bg-white focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="">Sin requerimiento</option>
                    {requirements.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.code ? `[${r.code}] ` : ''}
                        {r.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Responsable
                  </label>
                  <select
                    value={newTaskWorkerId}
                    onChange={(e) => setNewTaskWorkerId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-1.5 text-xs outline-none focus:bg-white focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="">Sin asignar</option>
                    {workers.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}{w.role === 'ADMIN' ? ' (Administrador)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setNewTaskOpen(false)}
                  className="rounded-xl"
                >
                  Cancelar
                </Button>
                <Button
                  disabled={isPending}
                  type="submit"
                  size="sm"
                  className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isPending ? 'Creando…' : 'Crear tarea'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Evidence Modal Component */}
      {evidenceModalTask && (
        <EvidenceModal
          projectId={projectId}
          taskId={evidenceModalTask.id}
          taskTitle={evidenceModalTask.title}
          evidences={evidenceModalTask.evidences || []}
          isOpen={true}
          onClose={() => setEvidenceModalTask(null)}
        />
      )}
    </div>
  );
}
