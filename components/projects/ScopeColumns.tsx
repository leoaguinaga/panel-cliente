import { CircleCheck, CircleMinus, Info } from 'lucide-react';

type Scope = { inclusions?: string | null; exclusions?: string | null; assumptions?: string | null } | null | undefined;

/** Cada línea del textarea es un punto; se quitan viñetas escritas a mano («-», «•», «*»). */
const points = (value?: string | null) => (value || '').split('\n').map((line) => line.replace(/^\s*[-•*]\s*/, '').trim()).filter(Boolean);

export const hasScope = (scope: Scope) => Boolean(scope && (points(scope.inclusions).length || points(scope.exclusions).length || points(scope.assumptions).length));

export function ScopeColumns({ scope, assumptionsLabel = 'Supuestos' }: { scope: Scope; assumptionsLabel?: string }) {
  const columns = [
    { label: 'Incluye', items: points(scope?.inclusions), icon: CircleCheck, tone: 'text-emerald-500' },
    { label: 'No incluye', items: points(scope?.exclusions), icon: CircleMinus, tone: 'text-slate-400' },
    { label: assumptionsLabel, items: points(scope?.assumptions), icon: Info, tone: 'text-orange-500' },
  ].filter((column) => column.items.length);
  return <div className="grid gap-5 md:grid-cols-3">{columns.map(({ label, items, icon: Icon, tone }) => <div key={label} className="min-w-0">
    <h4 className="text-xs font-semibold text-slate-500">{label}</h4>
    <ul className="mt-2 space-y-2">{items.map((item, index) => <li key={index} className="flex gap-2 text-sm leading-5 text-slate-700"><Icon className={`mt-0.5 size-4 shrink-0 ${tone}`} aria-hidden /><span className="min-w-0 break-words">{item}</span></li>)}</ul>
  </div>)}</div>;
}
