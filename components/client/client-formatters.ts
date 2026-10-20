export const projectStatus: Record<string, string> = {
  PLANNING: 'En planificación',
  IN_PROGRESS: 'En progreso',
  PAUSED: 'Pausado',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
};

export const paymentStatus: Record<string, string> = {
  PENDING: 'Pendiente',
  UNDER_REVIEW: 'En revisión',
  PARTIAL: 'Pago parcial',
  PAID: 'Pagado',
  OVERDUE: 'Vencido',
  CANCELLED: 'Cancelado',
};

export const paymentStatusStyles: Record<string, string> = {
  PENDING: 'bg-slate-100 text-slate-700 border-slate-200',
  UNDER_REVIEW: 'bg-amber-50 text-amber-800 border-amber-200 ring-1 ring-amber-500/30',
  PARTIAL: 'bg-blue-50 text-blue-800 border-blue-200',
  PAID: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  OVERDUE: 'bg-red-50 text-red-800 border-red-200',
  CANCELLED: 'bg-slate-100 text-slate-500 border-slate-200',
};

export const documentType: Record<string, string> = {
  COMMERCIAL_PROPOSAL: 'Propuesta comercial',
  SIGNED_CONTRACT: 'Contrato firmado',
  INVOICE: 'Factura',
  PAYMENT_PROOF: 'Comprobante de pago',
  DELIVERABLE: 'Entregable',
  OTHER: 'Otro',
};

export const formatDate = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat('es-PE', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
      }).format(new Date(value))
    : 'Sin fecha';

export const formatMoney = (value: number | string, currency: string) =>
  new Intl.NumberFormat('es-PE', { style: 'currency', currency: currency || 'PEN' }).format(Number(value));

export const formatBytes = (value: number) =>
  value < 1024 * 1024
    ? `${Math.max(1, Math.round(value / 1024))} KB`
    : `${(value / 1024 / 1024).toFixed(1)} MB`;

export const milestoneStatus: Record<string, string> = {
  PENDING: 'Pendiente',
  IN_PROGRESS: 'En curso',
  COMPLETED: 'Completado',
  BLOCKED: 'En espera',
};

export const sprintStatus: Record<string, string> = {
  PLANNED: 'Programada',
  ACTIVE: 'En curso',
  COMPLETED: 'Completada',
};
