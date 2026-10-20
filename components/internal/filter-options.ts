import type { FilterOption } from './FilterBar';

type Named = { id: string; name: string };

/** Opciones de un filtro con su conteo; las vacías van al final. */
export function withCounts(items: Array<{ value: string; label: string }>, counts?: Record<string, number>): FilterOption[] {
  const options = items.map((item) => ({ ...item, count: counts ? (counts[item.value] ?? 0) : undefined }));
  return counts ? [...options.filter((option) => option.count), ...options.filter((option) => !option.count)] : options;
}
export const namedOptions = (items: Named[]) => items.map((item) => ({ value: item.id, label: item.name }));
export const workerOptions = (workers: Named[]) => [...namedOptions(workers), { value: 'unassigned', label: 'Sin responsable' }];
export const DUE_OPTIONS: FilterOption[] = [
  { value: 'overdue', label: 'Vencidos' },
  { value: 'upcoming', label: 'Próximos 7 días' },
  { value: 'undated', label: 'Sin fecha' },
];
