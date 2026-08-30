const projectDateFormatter = new Intl.DateTimeFormat('es-PE', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'UTC',
});
const compactDateFormatter = new Intl.DateTimeFormat('es-PE', {
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
});

export const formatDate = (value?: Date | string | null) => value ? projectDateFormatter.format(new Date(value)) : 'Sin fecha';
export const formatCompactDate = (value?: Date | string | null) => value ? compactDateFormatter.format(new Date(value)) : 'Sin fecha';
export const formatCurrency = (value: number | string | { toString(): string }, currency = 'USD') => new Intl.NumberFormat('es-PE', { style: 'currency', currency }).format(Number(value));

const projectStatusLabels: Record<string, string> = {
  PLANNING: 'En planificación',
  IN_PROGRESS: 'En progreso',
  PAUSED: 'Pausado',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
};

const projectPriorityLabels: Record<string, string> = {
  LOW: 'Bajo',
  MEDIUM: 'Mediano',
  HIGH: 'Alto',
  URGENT: 'Urgente',
};

const projectTypeLabels: Record<string, string> = {
  LANDING: 'Landing Page',
  WEBSITE: 'Sitio Web',
  SYSTEM: 'Sistema',
  APP: 'Aplicación',
  BRANDING: 'Branding',
  UXUI: 'Diseño UX/UI',
  MAINTENANCE: 'Mantenimiento',
  CONSULTING: 'Consultoría',
  OTHER: 'Otro',
};

const humanizeFallback = (value: string) => value
  .toLowerCase()
  .replaceAll('_', ' ')
  .replace(/^./, (letter) => letter.toUpperCase());

export const formatProjectStatus = (value: string) => projectStatusLabels[value] || humanizeFallback(value);
export const formatProjectPriority = (value: string) => projectPriorityLabels[value] || humanizeFallback(value);
export const formatProjectType = (value: string) => projectTypeLabels[value] || humanizeFallback(value);
export const formatProjectPrice = (value: number | string) => {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return 'Sin precio asignado';
  return `USD ${new Intl.NumberFormat('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)}`;
};
