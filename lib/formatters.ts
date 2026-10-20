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
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta',
  URGENT: 'Urgente',
};

const taskStatusLabels: Record<string, string> = {
  TODO: 'Por hacer',
  IN_PROGRESS: 'En progreso',
  REVIEW: 'En revisión',
  BLOCKED: 'Bloqueada',
  DONE: 'Terminada',
};

const clientStatusLabels: Record<string, string> = {
  PROSPECT: 'Prospecto',
  ACTIVE: 'Activo',
  INACTIVE: 'Inactivo',
  ARCHIVED: 'Archivado',
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
export const leadStatusLabels: Record<string, string> = {
  MAPPED: 'Mapeo en zona',
  SITE_DEVELOPMENT: 'Maqueta en desarrollo',
  NEW: 'Nuevo',
  CONTACTED: 'Contactado',
  MEETING_SCHEDULED: 'Reunión agendada',
  PRESENTED: 'Contactado / demo',
  QUOTED: 'Cotizado',
  FEEDBACK_CHANGES: 'En negociación',
  WON: 'Ganado',
  LOST: 'Perdido',
};
export const formatLeadStatus = (value: string) => leadStatusLabels[value] || humanizeFallback(value);
export const formatTaskStatus = (value: string) => taskStatusLabels[value] || humanizeFallback(value);
export const formatClientStatus = (value: string) => clientStatusLabels[value] || humanizeFallback(value);
export const projectTypeOptions = Object.entries(projectTypeLabels).map(([value, label]) => ({ value, label }));
const projectTypeByLeadType: Record<string, string> = { LANDING: 'LANDING', SYSTEM: 'SYSTEM', APP: 'APP', FOXROOMS: 'OTHER' };
export const defaultProjectTypeForLead = (leadType?: string | null) => (leadType && projectTypeByLeadType[leadType]) || 'WEBSITE';
export const isWebsiteProjectType = (value: string) => value === 'WEBSITE' || value === 'LANDING';
export const formatProjectType = (value: string) => projectTypeLabels[value] || humanizeFallback(value);
export const formatProjectPrice = (value: number | string) => {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return 'Sin precio asignado';
  return `USD ${new Intl.NumberFormat('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)}`;
};
