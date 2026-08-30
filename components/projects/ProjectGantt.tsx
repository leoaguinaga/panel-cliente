'use client';

import { useMemo, useState } from 'react';
import type { ProjectMilestone, ProjectSprint, ProjectTask } from '@/src/modules/projects/types';

const DAY = 86_400_000;
const dateOnly = (value: string | Date) => { const date = new Date(value); return new Date(date.getFullYear(), date.getMonth(), date.getDate()); };
const addDays = (date: Date, days: number) => new Date(date.getTime() + days * DAY);
const diffDays = (a: Date, b: Date) => Math.round((dateOnly(a).getTime() - dateOnly(b).getTime()) / DAY);

type Scale = 'day' | 'week' | 'month';
export function ProjectGantt({ tasks, sprints, milestones }: { tasks: ProjectTask[]; sprints: ProjectSprint[]; milestones: ProjectMilestone[] }) {
  const [scale, setScale] = useState<Scale>('week');
  const [sprintId, setSprintId] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [workerId, setWorkerId] = useState('ALL');
  const workers = Array.from(new Map(tasks.filter((task) => task.assignedTo).map((task) => [task.assignedTo!.id, task.assignedTo!])).values());
  const filteredTasks = tasks.filter((task) => (sprintId === 'ALL' || task.sprint?.id === sprintId) && (status === 'ALL' || task.status === status) && (workerId === 'ALL' || task.assignedTo?.id === workerId));
  const scheduledTasks = filteredTasks.filter((task) => task.plannedStartDate && task.plannedEndDate);
  const unscheduled = filteredTasks.filter((task) => !task.plannedStartDate || !task.plannedEndDate);
  const range = useMemo(() => {
    const values = [
      ...scheduledTasks.flatMap((task) => [task.plannedStartDate!, task.plannedEndDate!]),
      ...sprints.flatMap((sprint) => [sprint.startDate, sprint.endDate].filter(Boolean) as string[]),
      ...milestones.map((milestone) => milestone.dueDate).filter(Boolean) as string[],
    ].map(dateOnly);
    const today = dateOnly(new Date());
    const min = values.length ? new Date(Math.min(...values.map(Number))) : today;
    const max = values.length ? new Date(Math.max(...values.map(Number))) : today;
    return { start: addDays(min, -3), end: addDays(max, 7) };
  }, [scheduledTasks, sprints, milestones]);
  const dayWidth = scale === 'day' ? 44 : scale === 'week' ? 18 : 7;
  const totalDays = Math.max(1, diffDays(range.end, range.start) + 1);
  const timelineWidth = totalDays * dayWidth;
  const ticks = Array.from({ length: totalDays }, (_, index) => addDays(range.start, index)).filter((_, index) => scale === 'day' || (scale === 'week' ? index % 7 === 0 : index % 30 === 0));
  const rows = sprints.flatMap((sprint) => [{ kind: 'sprint' as const, item: sprint }, ...scheduledTasks.filter((task) => task.sprint?.id === sprint.id).map((item) => ({ kind: 'task' as const, item }))]);
  const backlogRows = scheduledTasks.filter((task) => !task.sprint).map((item) => ({ kind: 'task' as const, item }));
  const allRows = [...rows, ...backlogRows, ...milestones.filter((milestone) => milestone.dueDate).map((item) => ({ kind: 'milestone' as const, item }))];
  const dependencies = filteredTasks.flatMap((task) => (task.blockedBy || []).map((dependency) => ({ ...dependency, successor: task })));
  const bar = (start: string, end: string) => ({ left: diffDays(dateOnly(start), range.start) * dayWidth, width: Math.max(dayWidth, (diffDays(dateOnly(end), dateOnly(start)) + 1) * dayWidth) });

  return <section aria-labelledby="gantt-title" className="space-y-4">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 id="gantt-title" className="text-base font-bold text-slate-900">Gantt del proyecto</h2><p className="mt-1 text-sm text-slate-500">Sprints, tareas e hitos sobre una línea de tiempo común.</p></div><div className="flex flex-wrap gap-2"><select aria-label="Filtrar por sprint" value={sprintId} onChange={(e) => setSprintId(e.target.value)} className="min-h-10 rounded-xl border bg-white px-3 text-xs"><option value="ALL">Todos los sprints</option>{sprints.map((sprint) => <option key={sprint.id} value={sprint.id}>{sprint.name}</option>)}</select><select aria-label="Filtrar por responsable" value={workerId} onChange={(e) => setWorkerId(e.target.value)} className="min-h-10 rounded-xl border bg-white px-3 text-xs"><option value="ALL">Todos los responsables</option>{workers.map((worker) => <option key={worker.id} value={worker.id}>{worker.name}</option>)}</select><select aria-label="Filtrar por estado" value={status} onChange={(e) => setStatus(e.target.value)} className="min-h-10 rounded-xl border bg-white px-3 text-xs"><option value="ALL">Todos los estados</option>{['TODO','IN_PROGRESS','REVIEW','BLOCKED','DONE'].map((value) => <option key={value}>{value}</option>)}</select><div className="flex rounded-xl border bg-white p-1" aria-label="Escala del Gantt">{(['day','week','month'] as Scale[]).map((value) => <button key={value} type="button" onClick={() => setScale(value)} aria-pressed={scale === value} className={`min-h-9 rounded-lg px-3 text-xs font-medium ${scale === value ? 'bg-slate-900 text-white' : 'text-slate-500'}`}>{value === 'day' ? 'Día' : value === 'week' ? 'Semana' : 'Mes'}</button>)}</div></div></div>
    <div className="overflow-hidden rounded-2xl border bg-white"><div className="grid grid-cols-[15rem_1fr]"><div className="border-r bg-slate-50 p-3 text-xs font-semibold text-slate-600">Elemento</div><div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"><div className="relative h-10 bg-slate-50" style={{ width: timelineWidth }}>{ticks.map((tick) => <span key={tick.toISOString()} className="absolute top-3 text-[10px] text-slate-500" style={{ left: diffDays(tick, range.start) * dayWidth + 4 }}>{tick.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })}</span>)}</div></div></div>{allRows.length === 0 ? <p className="p-8 text-center text-sm text-slate-500">No hay elementos programados con los filtros actuales.</p> : allRows.map((row) => {
      const start = row.kind === 'sprint' ? row.item.startDate : row.kind === 'task' ? row.item.plannedStartDate : row.item.dueDate;
      const end = row.kind === 'sprint' ? row.item.endDate : row.kind === 'task' ? row.item.plannedEndDate : row.item.dueDate;
      const label = row.kind === 'sprint' ? row.item.name : row.item.title;
      const unresolved = row.kind === 'task' ? (row.item.blockedBy || []).filter((dependency) => dependency.predecessor.status !== 'DONE') : [];
      return <div key={`${row.kind}-${row.item.id}`} className="grid min-h-12 grid-cols-[15rem_1fr] border-t"><div className={`border-r px-3 py-2 text-xs ${row.kind === 'task' ? 'pl-7 text-slate-600' : 'font-semibold text-slate-800'}`}>{row.kind === 'milestone' ? '◆ ' : ''}{label}{row.kind === 'task' && (row.item.blockedBy || []).length > 0 && <span className={`mt-1 block text-[10px] font-medium ${unresolved.length ? 'text-amber-700' : 'text-emerald-700'}`}>{unresolved.length ? `Bloqueada por ${unresolved.length} requisito${unresolved.length === 1 ? '' : 's'}` : 'Prerequisitos completados'}</span>}</div><div className="overflow-hidden"><div className="relative h-full min-h-12" style={{ width: timelineWidth }}>{ticks.map((tick) => <span key={tick.toISOString()} className="absolute inset-y-0 border-l border-slate-100" style={{ left: diffDays(tick, range.start) * dayWidth }} />)}{start && end && <span title={unresolved.length ? `Bloqueada por: ${unresolved.map((dependency) => dependency.predecessor.title).join(', ')}` : label} className={`absolute top-3 h-6 rounded-md ${row.kind === 'sprint' ? 'bg-indigo-200' : row.kind === 'milestone' ? 'rotate-45 bg-amber-500' : unresolved.length ? 'bg-amber-500 ring-2 ring-amber-200' : 'bg-blue-600'}`} style={row.kind === 'milestone' ? { left: bar(start, end).left, width: 16, height: 16 } : bar(start, end)} />}{diffDays(dateOnly(new Date()), range.start) >= 0 && <span className="absolute inset-y-0 w-px bg-rose-500" style={{ left: diffDays(dateOnly(new Date()), range.start) * dayWidth }} aria-label="Hoy" />}</div></div></div>;
    })}</div>
    <section aria-labelledby="dependency-flow-title" className="rounded-2xl border bg-white p-4"><div className="flex flex-wrap items-baseline justify-between gap-2"><h3 id="dependency-flow-title" className="text-sm font-semibold text-slate-900">Flujo de dependencias</h3><p className="text-xs text-slate-500">La tarea de la izquierda habilita la tarea de la derecha.</p></div>{dependencies.length === 0 ? <p className="mt-3 text-sm text-slate-500">Todavía no se han definido prerequisitos entre las tareas filtradas.</p> : <ul className="mt-3 grid gap-2 sm:grid-cols-2">{dependencies.map((dependency) => { const ready = dependency.predecessor.status === 'DONE'; return <li key={dependency.id} className="flex min-h-11 items-center gap-2 rounded-xl border px-3 py-2 text-xs"><span className={ready ? 'text-emerald-700' : 'text-amber-700'}>{dependency.predecessor.title}</span><span aria-hidden="true">→</span><span className="font-semibold text-slate-800">{dependency.successor.title}</span><span className={`ml-auto rounded-full px-2 py-1 text-[10px] font-semibold ${ready ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{ready ? 'Habilitada' : 'Bloqueada'}</span></li>; })}</ul>}</section>
    {unscheduled.length > 0 && <aside className="rounded-2xl border border-dashed bg-slate-50 p-4"><h3 className="text-sm font-semibold text-slate-800">Sin programar ({unscheduled.length})</h3><p className="mt-1 text-xs text-slate-500">Asigna inicio y fin planificados desde la edición de la tarea.</p><ul className="mt-3 grid gap-2 sm:grid-cols-2">{unscheduled.map((task) => <li key={task.id} className="rounded-lg border bg-white px-3 py-2 text-xs text-slate-700">{task.title}</li>)}</ul></aside>}
  </section>;
}
