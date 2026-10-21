import type { ClientDashboard } from '@/src/modules/dashboard/server/queries';

export type ClientProject = ClientDashboard['projects'][number];
export type ClientMilestone = ClientProject['milestones'][number];
export type ClientPayment = ClientDashboard['payments'][number];

/** Día corto en es-PE (UTC, como el resto del portal); vacío si no hay fecha. */
export const short = (v: string | null | undefined) => v ? new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(v)) : '';

/** Con muchos hitos se muestra el anterior, el actual y los dos siguientes. */
export function visibleSteps(milestones: ClientMilestone[], current: number) {
  if (milestones.length <= 5) return milestones.map((m, i) => ({ m, i }));
  const from = Math.max(0, Math.min(current - 1, milestones.length - 4));
  return milestones.slice(from, from + 4).map((m, k) => ({ m, i: from + k }));
}

export function paymentLabel(p: ClientPayment, milestones: ClientMilestone[]) {
  if (p.status === 'PAID') return { text: 'Pagado', tone: 'text-emerald-600' };
  if (p.status === 'UNDER_REVIEW') return { text: 'En validación', tone: 'text-amber-700' };
  if (p.status === 'OVERDUE') return { text: `Vencido ${short(p.dueDate)}`.trim(), tone: 'text-red-700' };
  if (p.dueDate) return { text: `Vence ${short(p.dueDate)}`, tone: 'text-orange-700' };
  const milestone = milestones.find((m) => m.id === p.milestoneId);
  if (milestone) return { text: milestone.id === milestones.at(-1)?.id ? 'Al lanzar' : `Al aprobar «${milestone.title}»`, tone: 'text-slate-500' };
  return { text: 'Por definir', tone: 'text-slate-500' };
}
