'use client';

import { useEffect, useRef, useState } from 'react';
import { isMilestoneDone, type ProjectMilestone, type ProjectSprint, type ProjectTask } from '@/src/modules/projects/types';

const DAY = 86_400_000;
const LABEL_WIDTH = 240;
const dateOnly = (value: string | Date) => { const date = new Date(value); return new Date(date.getFullYear(), date.getMonth(), date.getDate()); };
const addDays = (date: Date, days: number) => new Date(date.getTime() + days * DAY);
const diffDays = (a: Date, b: Date) => Math.round((dateOnly(a).getTime() - dateOnly(b).getTime()) / DAY);
const shortDate = (value: string | Date) => new Date(value).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });

const TASK_STATUS: Record<string, string> = { TODO: 'Por hacer', IN_PROGRESS: 'En progreso', REVIEW: 'En revisión', BLOCKED: 'Bloqueada', DONE: 'Terminada' };
const TASK_BAR: Record<string, string> = { TODO: 'bg-slate-400', IN_PROGRESS: 'bg-blue-600', REVIEW: 'bg-violet-500', BLOCKED: 'bg-rose-500', DONE: 'bg-emerald-500' };

type Scale = 'day' | 'week' | 'month';
type Row =
  | { kind: 'sprint'; item: ProjectSprint; done: number; total: number }
  | { kind: 'task'; item: ProjectTask }
  | { kind: 'milestone'; item: ProjectMilestone };

export function ProjectGantt({ tasks, sprints, milestones }: { tasks: ProjectTask[]; sprints: ProjectSprint[]; milestones: ProjectMilestone[] }) {
  const [scale, setScale] = useState<Scale>('week');
  const [sprintId, setSprintId] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [workerId, setWorkerId] = useState('ALL');
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const scroller = useRef<HTMLDivElement>(null);

  const workers = Array.from(new Map(tasks.filter((task) => task.assignedTo).map((task) => [task.assignedTo!.id, task.assignedTo!])).values());
  const filteredTasks = tasks.filter((task) => (sprintId === 'ALL' || task.sprint?.id === sprintId) && (status === 'ALL' || task.status === status) && (workerId === 'ALL' || task.assignedTo?.id === workerId));
  const scheduledTasks = filteredTasks.filter((task) => task.plannedStartDate && task.plannedEndDate);
  const unscheduled = filteredTasks.filter((task) => !task.plannedStartDate || !task.plannedEndDate);
  const visibleSprints = sprints.filter((sprint) => sprintId === 'ALL' || sprint.id === sprintId);

  const range = (() => {
    const values = [
      ...scheduledTasks.flatMap((task) => [task.plannedStartDate!, task.plannedEndDate!]),
      ...visibleSprints.flatMap((sprint) => [sprint.startDate, sprint.endDate].filter(Boolean) as string[]),
      ...milestones.map((milestone) => milestone.dueDate).filter(Boolean) as string[],
    ].map(dateOnly);
    const today = dateOnly(new Date());
    const min = values.length ? new Date(Math.min(...values.map(Number))) : today;
    const max = values.length ? new Date(Math.max(...values.map(Number))) : today;
    return { start: addDays(min, -3), end: addDays(max, 7) };
  })();

  const dayWidth = scale === 'day' ? 40 : scale === 'week' ? 16 : 5;
  const totalDays = Math.max(1, diffDays(range.end, range.start) + 1);
  const timelineWidth = totalDays * dayWidth;
  const today = dateOnly(new Date());
  const todayOffset = diffDays(today, range.start);
  const todayVisible = todayOffset >= 0 && todayOffset < totalDays;
  const x = (value: string | Date) => diffDays(dateOnly(value), range.start) * dayWidth;
  const bar = (start: string, end: string) => ({ left: x(start), width: Math.max(dayWidth, (diffDays(dateOnly(end), dateOnly(start)) + 1) * dayWidth) });

  // Two header bands: months on top, days/weeks below.
  const days = Array.from({ length: totalDays }, (_, index) => addDays(range.start, index));
  const months = days.filter((d, index) => index === 0 || d.getDate() === 1);
  const minorTicks = days.filter((d) => scale === 'day' || (scale === 'week' ? d.getDay() === 1 : d.getDate() === 1 || d.getDate() === 15));
  const weekends = scale === 'day' ? days.filter((d) => d.getDay() === 0 || d.getDay() === 6) : [];

  const rows: Row[] = [
    ...visibleSprints.flatMap((sprint) => {
      const sprintTasks = tasks.filter((task) => task.sprint?.id === sprint.id);
      const own = scheduledTasks.filter((task) => task.sprint?.id === sprint.id);
      return [{ kind: 'sprint' as const, item: sprint, done: sprintTasks.filter((t) => t.status === 'DONE').length, total: sprintTasks.length }, ...(collapsed.has(sprint.id) ? [] : own.map((item) => ({ kind: 'task' as const, item })))];
    }),
    ...scheduledTasks.filter((task) => !task.sprint).map((item) => ({ kind: 'task' as const, item })),
    ...milestones.filter((milestone) => milestone.dueDate).map((item) => ({ kind: 'milestone' as const, item })),
  ];
  const dependencies = filteredTasks.flatMap((task) => (task.blockedBy || []).map((dependency) => ({ ...dependency, successor: task })));
  const overdue = scheduledTasks.filter((task) => task.status !== 'DONE' && dateOnly(task.plannedEndDate!) < today).length;

  const scrollToToday = () => { if (scroller.current && todayVisible) scroller.current.scrollTo({ left: Math.max(0, todayOffset * dayWidth - 120), behavior: 'smooth' }); };
  useEffect(() => { scrollToToday(); }, [scale]); // eslint-disable-line react-hooks/exhaustive-deps
  const toggle = (id: string) => setCollapsed((current) => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next; });

  const select = 'min-h-10 rounded-xl border bg-card px-3 text-xs';
  return <section aria-labelledby="gantt-title" className="space-y-4">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div><h2 id="gantt-title" className="text-base font-bold text-slate-900">Gantt del proyecto</h2>
        <p className="mt-1 text-sm text-slate-500">{scheduledTasks.length} tareas programadas{overdue > 0 && <span className="font-medium text-rose-600"> · {overdue} atrasada{overdue === 1 ? '' : 's'}</span>}</p></div>
      <div className="flex flex-wrap gap-2">
        {sprints.length > 0 && <select aria-label="Filtrar por sprint" value={sprintId} onChange={(e) => setSprintId(e.target.value)} className={select}><option value="ALL">Todos los sprints</option>{sprints.map((sprint) => <option key={sprint.id} value={sprint.id}>{sprint.name}</option>)}</select>}
        <select aria-label="Filtrar por responsable" value={workerId} onChange={(e) => setWorkerId(e.target.value)} className={select}><option value="ALL">Todos los responsables</option>{workers.map((worker) => <option key={worker.id} value={worker.id}>{worker.name}</option>)}</select>
        <select aria-label="Filtrar por estado" value={status} onChange={(e) => setStatus(e.target.value)} className={select}><option value="ALL">Todos los estados</option>{Object.entries(TASK_STATUS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
        <button type="button" onClick={scrollToToday} disabled={!todayVisible} className="min-h-10 rounded-xl border bg-card px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40">Ir a hoy</button>
        <div className="flex rounded-xl border bg-card p-1" role="group" aria-label="Escala del Gantt">{(['day', 'week', 'month'] as Scale[]).map((value) => <button key={value} type="button" onClick={() => setScale(value)} aria-pressed={scale === value} className={`min-h-8 rounded-lg px-3 text-xs font-medium ${scale === value ? 'bg-brand-button text-white' : 'text-slate-500 hover:text-slate-900'}`}>{value === 'day' ? 'Día' : value === 'week' ? 'Semana' : 'Mes'}</button>)}</div>
      </div>
    </div>

    <div className="rounded-2xl border bg-card">
      {rows.length === 0 ? <p className="p-8 text-center text-sm text-slate-500">No hay elementos programados con los filtros actuales.</p> :
      <div ref={scroller} className="max-h-[70vh] overflow-auto rounded-2xl">
        <div className="relative" style={{ width: LABEL_WIDTH + timelineWidth }}>
          {/* Header */}
          <div className="sticky top-0 z-20 flex border-b bg-slate-50">
            <div className="sticky left-0 z-30 flex shrink-0 items-end border-r bg-slate-50 px-3 pb-2 text-xs font-semibold text-slate-600" style={{ width: LABEL_WIDTH }}>Elemento</div>
            <div className="relative h-14" style={{ width: timelineWidth }}>
              {months.map((m) => <span key={`m-${m.toISOString()}`} className="absolute top-0 h-7 border-l border-slate-200 px-2 pt-1.5 text-[11px] font-semibold capitalize text-slate-700" style={{ left: x(m) }}>{m.toLocaleDateString('es-PE', { month: 'long', year: 'numeric' })}</span>)}
              {minorTicks.map((tick) => <span key={`t-${tick.toISOString()}`} className="absolute bottom-1.5 pl-1 text-[10px] text-slate-500" style={{ left: x(tick) }}>{scale === 'day' ? tick.getDate() : shortDate(tick)}</span>)}
              {todayVisible && <span className="absolute bottom-0 z-10 -translate-x-1/2 rounded-t bg-rose-500 px-1.5 text-[10px] font-semibold text-white" style={{ left: todayOffset * dayWidth + dayWidth / 2 }}>Hoy</span>}
            </div>
          </div>
          {/* Background grid spanning every row */}
          <div aria-hidden="true" className="pointer-events-none absolute bottom-0 top-14" style={{ left: LABEL_WIDTH, width: timelineWidth }}>
            {weekends.map((d) => <span key={`w-${d.toISOString()}`} className="absolute inset-y-0 bg-slate-50" style={{ left: x(d), width: dayWidth }} />)}
            {minorTicks.map((tick) => <span key={`g-${tick.toISOString()}`} className="absolute inset-y-0 border-l border-slate-100" style={{ left: x(tick) }} />)}
            {todayVisible && <span className="absolute inset-y-0 z-10 w-0.5 bg-rose-500/70" style={{ left: todayOffset * dayWidth + dayWidth / 2 }} />}
          </div>
          {/* Rows */}
          <ul>{rows.map((row) => {
            const start = row.kind === 'sprint' ? row.item.startDate : row.kind === 'task' ? row.item.plannedStartDate : row.item.dueDate;
            const end = row.kind === 'sprint' ? row.item.endDate : row.kind === 'task' ? row.item.plannedEndDate : row.item.dueDate;
            const label = row.kind === 'sprint' ? row.item.name : row.item.title;
            const unresolved = row.kind === 'task' ? (row.item.blockedBy || []).filter((dependency) => dependency.predecessor.status !== 'DONE') : [];
            const late = row.kind === 'task' && row.item.status !== 'DONE' && !!end && dateOnly(end) < today;
            const title = row.kind === 'task'
              ? `${label} · ${TASK_STATUS[row.item.status] || row.item.status}${row.item.assignedTo ? ` · ${row.item.assignedTo.name}` : ''}${start && end ? ` · ${shortDate(start)} – ${shortDate(end)}` : ''}${unresolved.length ? ` · Bloqueada por: ${unresolved.map((d) => d.predecessor.title).join(', ')}` : ''}`
              : `${label}${start && end ? ` · ${shortDate(start)}${start !== end ? ` – ${shortDate(end)}` : ''}` : ''}`;
            const geometry = start && end ? bar(start, end) : null;
            return <li key={`${row.kind}-${row.item.id}`} className={`flex border-b last:border-b-0 ${row.kind === 'sprint' ? 'bg-indigo-50/40' : ''}`}>
              <div className={`sticky left-0 z-10 shrink-0 border-r px-3 py-2 text-xs ${row.kind === 'sprint' ? 'bg-indigo-50 font-semibold text-slate-800' : 'bg-card'} ${row.kind === 'task' ? 'pl-8 text-slate-600' : ''}`} style={{ width: LABEL_WIDTH }}>
                {row.kind === 'sprint' ? <button type="button" onClick={() => toggle(row.item.id)} aria-expanded={!collapsed.has(row.item.id)} className="flex w-full items-center gap-1.5 text-left"><span aria-hidden="true" className={`inline-block transition-transform ${collapsed.has(row.item.id) ? '' : 'rotate-90'}`}>▸</span><span className="truncate">{label}</span><span className="ml-auto shrink-0 font-normal text-slate-500">{row.done}/{row.total}</span></button>
                  : <p className="truncate" title={label}>{row.kind === 'milestone' ? '◆ ' : ''}{label}</p>}
                {row.kind === 'task' && <p className="mt-0.5 truncate text-[10px] text-slate-400">{row.item.assignedTo?.name || 'Sin responsable'}{late && <span className="font-medium text-rose-600"> · atrasada</span>}{unresolved.length > 0 && <span className="font-medium text-amber-700"> · {unresolved.length} bloqueo{unresolved.length === 1 ? '' : 's'}</span>}</p>}
              </div>
              <div className="relative min-h-11" style={{ width: timelineWidth }}>
                {geometry && (row.kind === 'milestone'
                  ? <span title={title} className={`absolute top-3.5 h-3.5 w-3.5 -translate-x-1/2 rotate-45 rounded-[2px] ring-2 ring-card ${isMilestoneDone(row.item.status) ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ left: geometry.left + dayWidth / 2 }} />
                  : row.kind === 'sprint'
                    ? <span title={title} className="absolute top-4 h-3 rounded-full bg-indigo-300" style={geometry}><span className="absolute inset-y-0 left-0 rounded-full bg-indigo-600" style={{ width: `${row.total ? (row.done / row.total) * 100 : 0}%` }} /></span>
                    : <span title={title} className={`absolute top-2.5 flex h-6 items-center overflow-hidden rounded-md px-1.5 text-[10px] font-medium text-white ${TASK_BAR[row.item.status] || 'bg-blue-600'} ${late ? 'ring-2 ring-rose-300' : unresolved.length ? 'ring-2 ring-amber-300' : ''}`} style={geometry}>{geometry.width > 70 && <span className="truncate">{label}</span>}</span>)}
              </div>
            </li>;
          })}</ul>
        </div>
      </div>}
      <ul className="flex flex-wrap gap-x-4 gap-y-2 border-t px-4 py-3 text-[11px] text-slate-500" aria-label="Leyenda">
        {Object.entries(TASK_STATUS).map(([value, label]) => <li key={value} className="flex items-center gap-1.5"><span className={`h-2.5 w-4 rounded-sm ${TASK_BAR[value]}`} />{label}</li>)}
        {sprints.length > 0 && <li className="flex items-center gap-1.5"><span className="h-2.5 w-4 rounded-full bg-indigo-300" />Sprint (avance)</li>}
        <li className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rotate-45 rounded-[2px] bg-amber-500" />Hito</li>
      </ul>
    </div>

    <section aria-labelledby="dependency-flow-title" className="rounded-2xl border bg-card p-4"><div className="flex flex-wrap items-baseline justify-between gap-2"><h3 id="dependency-flow-title" className="text-sm font-semibold text-slate-900">Flujo de dependencias</h3><p className="text-xs text-slate-500">La tarea de la izquierda habilita la tarea de la derecha.</p></div>{dependencies.length === 0 ? <p className="mt-3 text-sm text-slate-500">Todavía no se han definido prerequisitos entre las tareas filtradas.</p> : <ul className="mt-3 grid gap-2 sm:grid-cols-2">{dependencies.map((dependency) => { const ready = dependency.predecessor.status === 'DONE'; return <li key={dependency.id} className="flex min-h-11 items-center gap-2 rounded-xl border px-3 py-2 text-xs"><span className={ready ? 'text-emerald-700' : 'text-amber-700'}>{dependency.predecessor.title}</span><span aria-hidden="true">→</span><span className="font-semibold text-slate-800">{dependency.successor.title}</span><span className={`ml-auto rounded-full px-2 py-1 text-[10px] font-semibold ${ready ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{ready ? 'Habilitada' : 'Bloqueada'}</span></li>; })}</ul>}</section>
    {unscheduled.length > 0 && <aside className="rounded-2xl border border-dashed bg-slate-50 p-4"><h3 className="text-sm font-semibold text-slate-800">Sin programar ({unscheduled.length})</h3><p className="mt-1 text-xs text-slate-500">Asigna inicio y fin planificados desde la edición de la tarea.</p><ul className="mt-3 grid gap-2 sm:grid-cols-2">{unscheduled.map((task) => <li key={task.id} className="rounded-lg border bg-card px-3 py-2 text-xs text-slate-700">{task.title}</li>)}</ul></aside>}
  </section>;
}
