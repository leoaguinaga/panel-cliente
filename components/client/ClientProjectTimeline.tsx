import { formatDate, milestoneStatus, sprintStatus } from '@/components/client/client-formatters';
import { isMilestoneDone } from '@/src/modules/projects/types';

type Phase = { id: string; name: string; status: string; startDate: string | null; endDate: string | null };
type Milestone = { id: string; title: string; status: string; dueDate?: string | null; completedAt: string | null };

const DAY = 86_400_000;
const day = (value: string | Date) => { const d = new Date(value); return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()); };
const monthLabel = new Intl.DateTimeFormat('es-PE', { month: 'short', year: '2-digit', timeZone: 'UTC' });

const phaseTone: Record<string, string> = { COMPLETED: 'bg-emerald-500', ACTIVE: 'bg-orange-500', PLANNED: 'bg-slate-300' };

/** Cronograma de solo lectura para el cliente: fases (sprints) e hitos visibles en una escala porcentual, sin scroll horizontal. */
export function ClientProjectTimeline({ startDate, endDate, phases, milestones }: { startDate: string | null; endDate: string | null; phases: Phase[]; milestones: Milestone[] }) {
  const scheduled = phases.filter((phase) => phase.startDate && phase.endDate);
  const dated = milestones.filter((milestone) => milestone.dueDate || milestone.completedAt);
  const points = [startDate, endDate, ...scheduled.flatMap((phase) => [phase.startDate!, phase.endDate!]), ...dated.map((m) => (m.dueDate || m.completedAt)!)].filter(Boolean).map((value) => day(value!));
  if (points.length < 2 || (scheduled.length === 0 && dated.length === 0)) return <p className="text-sm text-slate-600">El cronograma aparecerá cuando el equipo programe las fases del proyecto.</p>;

  const start = Math.min(...points); const end = Math.max(...points, start + 7 * DAY); const span = end - start;
  const pct = (value: number) => Math.min(100, Math.max(0, ((value - start) / span) * 100));
  const today = day(new Date()); const todayVisible = today >= start && today <= end;
  const months: number[] = []; const cursor = new Date(start); cursor.setUTCDate(1); cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  while (cursor.getTime() <= end) { months.push(cursor.getTime()); cursor.setUTCMonth(cursor.getUTCMonth() + 1); }
  const labelStep = Math.max(1, Math.ceil(months.length / 6));

  const grid = <>{months.map((m) => <span key={m} aria-hidden="true" className="absolute inset-y-0 border-l border-dashed border-slate-200" style={{ left: `${pct(m)}%` }} />)}{todayVisible && <span aria-hidden="true" className="absolute inset-y-0 w-0.5 bg-orange-500/70" style={{ left: `${pct(today)}%` }} />}</>;

  return <div>
    <div className="relative mb-2 ml-0 h-5 text-[11px] font-medium uppercase tracking-wide text-slate-400 sm:ml-44">
      {months.map((m, index) => index % labelStep === 0 && <span key={m} className="absolute -translate-x-1/2 whitespace-nowrap" style={{ left: `${pct(m)}%` }}>{monthLabel.format(new Date(m))}</span>)}
      {todayVisible && <span className="absolute -top-0.5 -translate-x-1/2 rounded-full bg-orange-500 px-1.5 py-0.5 text-[10px] font-semibold normal-case tracking-normal text-white" style={{ left: `${pct(today)}%` }}>Hoy</span>}
    </div>
    <ol className="space-y-2" aria-label="Fases del proyecto">
      {scheduled.map((phase) => { const left = pct(day(phase.startDate!)); const width = Math.max(1.5, pct(day(phase.endDate!) + DAY) - left); return <li key={phase.id} className="grid gap-1 sm:grid-cols-[10rem_1fr] sm:items-center sm:gap-4">
        <div className="flex items-baseline justify-between gap-2 sm:block"><p className="truncate text-sm font-medium text-slate-900">{phase.name}</p><p className="text-xs text-slate-500">{sprintStatus[phase.status] || phase.status}</p></div>
        <div className="relative h-8 rounded-lg bg-slate-50">{grid}<span className={`absolute top-1.5 h-5 rounded-md ${phaseTone[phase.status] || 'bg-slate-300'}`} style={{ left: `${left}%`, width: `${width}%` }} title={`${formatDate(phase.startDate)} – ${formatDate(phase.endDate)}`} /><span className="sr-only">{`Del ${formatDate(phase.startDate)} al ${formatDate(phase.endDate)}`}</span></div>
      </li>; })}
      {dated.length > 0 && <li className="grid gap-1 sm:grid-cols-[10rem_1fr] sm:items-center sm:gap-4">
        <p className="text-sm font-medium text-slate-900">Hitos</p>
        <div className="relative h-8 rounded-lg bg-slate-50">{grid}{dated.map((m) => { const at = day((m.completedAt || m.dueDate)!); const done = isMilestoneDone(m.status); return <span key={m.id} className={`absolute top-2 h-4 w-4 -translate-x-1/2 rotate-45 rounded-[3px] ring-2 ring-card ${done ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ left: `${pct(at)}%` }} title={`${m.title} · ${milestoneStatus[m.status] || m.status} · ${formatDate(m.completedAt || m.dueDate || null)}`} />; })}</div>
      </li>}
    </ol>
    <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500" aria-label="Leyenda">
      <li className="flex items-center gap-1.5"><span className="h-2.5 w-4 rounded-sm bg-emerald-500" />Completado</li>
      <li className="flex items-center gap-1.5"><span className="h-2.5 w-4 rounded-sm bg-orange-500" />En curso</li>
      <li className="flex items-center gap-1.5"><span className="h-2.5 w-4 rounded-sm bg-slate-300" />Programado</li>
      <li className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rotate-45 rounded-[2px] bg-amber-500" />Hito pendiente</li>
    </ul>
  </div>;
}
