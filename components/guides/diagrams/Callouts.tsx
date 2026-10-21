import type { ReactNode } from 'react';
import { Info, TriangleAlert } from 'lucide-react';

/** Aclaración breve dentro de una guía. */
export function Nota({ children }: { children: ReactNode }) {
  return (
    <aside className="my-5 flex gap-3 rounded-xl border bg-card px-4 py-3 text-slate-700 [&>div>p]:my-1">
      <Info size={18} className="mt-1.5 shrink-0 text-blue-700" aria-hidden="true" />
      <div><span className="sr-only">Nota: </span>{children}</div>
    </aside>
  );
}

/** Algo que el sistema impide o que suele salir mal. */
export function Atencion({ children }: { children: ReactNode }) {
  return (
    <aside className="my-5 flex gap-3 rounded-xl border border-[#644039] bg-[#302322] px-4 py-3 text-slate-700 [&>div>p]:my-1">
      <TriangleAlert size={18} className="mt-1.5 shrink-0 text-brand" aria-hidden="true" />
      <div><span className="sr-only">Atención: </span>{children}</div>
    </aside>
  );
}

/** Paso a paso: envuelve una lista numerada de Markdown. */
export function Pasos({ children }: { children: ReactNode }) {
  return <div className="my-5 rounded-xl border bg-card px-5 py-1 [&_ol]:my-3">{children}</div>;
}
