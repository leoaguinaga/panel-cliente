const styles: Record<string, string> = {
  IN_PROGRESS: 'bg-blue-50 text-blue-700 ring-blue-600/20', ACTIVE: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  DONE: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20', COMPLETED: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  BLOCKED: 'bg-red-50 text-red-700 ring-red-600/20', PAUSED: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  TODO: 'bg-slate-50 text-slate-700 ring-slate-600/20', PLANNING: 'bg-violet-50 text-violet-700 ring-violet-600/20',
  DELIVERED: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20', CANCELLED: 'bg-slate-100 text-slate-600 ring-slate-500/20',
};
const labels: Record<string, string> = { IN_PROGRESS: 'En progreso', ACTIVE: 'Activo', DONE: 'Completada', COMPLETED: 'Completado', BLOCKED: 'Bloqueado', PAUSED: 'Pausado', TODO: 'Pendiente', PLANNING: 'Planificación', DELIVERED: 'Entregado', CANCELLED: 'Cancelado' };

export function StatusBadge({ status }: { status: string }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${styles[status] || styles.TODO}`}>{labels[status] || status}</span>;
}
