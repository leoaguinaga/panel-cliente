import type { TodayItem, TodayItemKind } from '@/src/modules/dashboard/server/queries';

export const kindLabels: Record<TodayItemKind, string> = {
  task: 'Tarea',
  lead: 'Seguimiento',
  demo: 'Demo',
  demo_follow_up: 'Seguimiento demo',
  deliverable: 'Entrega',
  milestone_review: 'Hito',
  payment_review: 'Pago',
  payment_due: 'Cobro',
  project_unassigned: 'Sin responsable',
  task_blocked: 'Bloqueada',
};

/** Clases del distintivo por tipo; el color separa trabajo, comercial, dinero y alertas. */
export const kindTone: Record<TodayItemKind, string> = {
  task: 'bg-muted text-foreground/75',
  lead: 'bg-sky-50 text-sky-800',
  demo: 'bg-violet-50 text-violet-800',
  demo_follow_up: 'bg-violet-50 text-violet-800',
  deliverable: 'bg-amber-50 text-amber-800',
  milestone_review: 'bg-violet-50 text-violet-800',
  payment_review: 'bg-emerald-50 text-emerald-800',
  payment_due: 'bg-emerald-50 text-emerald-800',
  project_unassigned: 'bg-red-50 text-red-700',
  task_blocked: 'bg-red-50 text-red-700',
};

/** Color sólido del punto en el calendario semanal. */
export const kindDot: Record<TodayItemKind, string> = {
  task: 'bg-stone-400',
  lead: 'bg-sky-500',
  demo: 'bg-violet-500',
  demo_follow_up: 'bg-violet-400',
  deliverable: 'bg-amber-500',
  milestone_review: 'bg-violet-500',
  payment_review: 'bg-emerald-500',
  payment_due: 'bg-emerald-500',
  project_unassigned: 'bg-red-500',
  task_blocked: 'bg-red-500',
};

export const actionLabels: Record<TodayItemKind, string> = {
  task: 'Abrir tarea',
  lead: 'Ver lead',
  demo: 'Abrir demo',
  demo_follow_up: 'Abrir demo',
  deliverable: 'Ver entrega',
  milestone_review: 'Ver hito',
  payment_review: 'Revisar comprobante',
  payment_due: 'Ver cobro',
  project_unassigned: 'Asignar responsable',
  task_blocked: 'Ver bloqueo',
};

export function itemHref(item: TodayItem) {
  const { ref } = item;
  switch (item.kind) {
    case 'task':
    case 'task_blocked':
      return `/internal/projects/${ref.projectId}/tasks/kanban?task=${ref.taskId}`;
    case 'lead':
      return `/internal/leads/${ref.leadId}`;
    case 'demo':
    case 'demo_follow_up':
      return `/internal/products/${ref.productId}/demos`;
    case 'deliverable':
      return `/internal/projects/${ref.projectId}`;
    case 'milestone_review':
      return `/internal/projects/${ref.projectId}/planning/milestones`;
    case 'payment_review':
      return '/internal/payments?status=UNDER_REVIEW';
    case 'payment_due':
      return ref.projectId ? `/internal/projects/${ref.projectId}/documentation/payments` : '/internal/payments';
    case 'project_unassigned':
      return `/internal/projects/${ref.projectId}/settings`;
  }
}

const DAY_MS = 86_400_000;
export const daysBetween = (from: string, to: string) => Math.round((Date.parse(to) - Date.parse(from)) / DAY_MS);
export const addDays = (key: string, days: number) => new Date(Date.parse(key) + days * DAY_MS).toISOString().slice(0, 10);

const longDate = new Intl.DateTimeFormat('es-PE', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
const weekdayShort = new Intl.DateTimeFormat('es-PE', { weekday: 'short', timeZone: 'UTC' });
const monthShort = new Intl.DateTimeFormat('es-PE', { month: 'short', timeZone: 'UTC' });

export const formatLongDay = (key: string) => {
  const text = longDate.format(new Date(key));
  return text.charAt(0).toUpperCase() + text.slice(1);
};
export const formatWeekday = (key: string) => weekdayShort.format(new Date(key)).replace('.', '');
export const formatMonth = (key: string) => monthShort.format(new Date(key)).replace('.', '');
export const isWeekend = (key: string) => [0, 6].includes(new Date(key).getUTCDay());

export const formatMoney = (amount: TodayItem['amount']) =>
  amount ? new Intl.NumberFormat('es-PE', { style: 'currency', currency: amount.currency, maximumFractionDigits: 0 }).format(amount.value) : null;

/** Texto corto de la columna «cuándo» según el grupo. */
export function whenLabel(item: TodayItem, today: string) {
  if (!item.date) return null;
  const diff = daysBetween(item.date, today);
  if (item.kind === 'milestone_review') return diff <= 0 ? 'desde hoy' : `hace ${diff} ${diff === 1 ? 'día' : 'días'}`;
  if (item.kind === 'task_blocked') return diff <= 0 ? 'desde hoy' : `hace ${diff} ${diff === 1 ? 'día' : 'días'}`;
  if (item.kind === 'payment_review') return 'por revisar';
  if (diff === 0) return item.kind === 'demo' || item.kind === 'lead' || item.kind === 'demo_follow_up' ? 'hoy' : 'vence hoy';
  if (diff === 1) return 'ayer';
  if (diff > 1) return `hace ${diff} días`;
  return null;
}
