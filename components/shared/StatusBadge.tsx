const styles: Record<string, string> = {
  IN_PROGRESS: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  ACTIVE: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  DONE: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  COMPLETED: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  BLOCKED: 'bg-red-50 text-red-700 ring-red-600/20',
  REVIEW: 'bg-violet-50 text-violet-700 ring-violet-600/20',
  PROSPECT: 'bg-sky-50 text-sky-700 ring-sky-600/20',
  INACTIVE: 'bg-slate-100 text-slate-600 ring-slate-500/20',
  ARCHIVED: 'bg-slate-100 text-slate-600 ring-slate-500/20',
  PAUSED: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  TODO: 'bg-slate-50 text-slate-700 ring-slate-600/20',
  PLANNING: 'bg-violet-50 text-violet-700 ring-violet-600/20',
  DELIVERED: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  CANCELLED: 'bg-slate-100 text-slate-600 ring-slate-500/20',
  UNDER_REVIEW: 'bg-amber-50 text-amber-800 ring-amber-600/30 font-semibold animate-pulse',
  PAID: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  PENDING: 'bg-slate-50 text-slate-700 ring-slate-600/20',
  PARTIAL: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  OVERDUE: 'bg-red-50 text-red-700 ring-red-600/20',
};

const labels: Record<string, string> = {
  IN_PROGRESS: 'En progreso',
  ACTIVE: 'Activo',
  DONE: 'Completada',
  COMPLETED: 'Completado',
  BLOCKED: 'Bloqueado',
  REVIEW: 'En revisión',
  PROSPECT: 'Prospecto',
  INACTIVE: 'Inactivo',
  ARCHIVED: 'Archivado',
  PAUSED: 'Pausado',
  TODO: 'Pendiente',
  PLANNING: 'Planificación',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
  UNDER_REVIEW: 'Por verificar',
  PAID: 'Pagado',
  PENDING: 'Pendiente',
  PARTIAL: 'Pago parcial',
  OVERDUE: 'Vencido',
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
        styles[status] || styles.TODO
      }`}
    >
      {status === 'UNDER_REVIEW' && <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />}
      {labels[status] || status}
    </span>
  );
}
