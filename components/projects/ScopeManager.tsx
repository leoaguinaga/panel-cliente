'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';
import Link from 'next/link';
import { upsertScopeAction } from '@/src/modules/projects/server/actions';
import type { ProjectDeliverable, ProjectScope } from '@/src/modules/projects/types';

const field = 'mt-1 w-full rounded-xl border bg-slate-50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600';
export function ScopeManager({ projectId, scope, looseDeliverables = [] }: { projectId: string; scope: ProjectScope | null; looseDeliverables?: ProjectDeliverable[] }) {
  const [pending, startTransition] = useTransition();

  function saveScope(formData: FormData) {
    startTransition(async () => {
      const toastId = toast.loading('Guardando alcance…');
      try {
        await upsertScopeAction(projectId, formData);
        toast.success('Alcance guardado', {
          id: toastId,
          description: 'Los cambios del alcance contractual se guardaron correctamente.',
        });
      } catch {
        toast.error('No se pudo guardar el alcance', {
          id: toastId,
          description: 'Tus cambios siguen en el formulario. Vuelve a intentarlo.',
        });
      }
    });
  }

  return <div className="grid gap-5 xl:grid-cols-[1.3fr_1fr]"><form onSubmit={(event) => { event.preventDefault(); if (!pending) saveScope(new FormData(event.currentTarget)); }} aria-busy={pending} className="space-y-4 rounded-2xl border bg-card p-5"><h3 className="text-sm font-bold text-slate-900">Alcance contractual</h3><p className="text-xs text-slate-500">Una línea por punto. El cliente lo ve en su portal; el resumen del proyecto es la descripción de <Link href={`/internal/projects/${projectId}/planning/scope?ajustes=1`} className="font-semibold text-slate-700 underline underline-offset-2">Ajustes</Link>.</p>{[['inclusions','Incluye'],['exclusions','No incluye'],['assumptions','Supuestos']].map(([name,label]) => <label key={name} className="block text-xs font-semibold text-slate-700">{label}<textarea name={name} rows={4} defaultValue={(scope?.[name as keyof ProjectScope] as string | null) || ''} className={field} /></label>)}<div className="flex justify-end"><button type="submit" disabled={pending} className="min-h-11 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-60">{pending ? 'Guardando…' : 'Guardar alcance'}</button></div></form><aside className="space-y-3 rounded-2xl border bg-slate-50 p-5"><h3 className="text-sm font-bold text-slate-900">Entregables</h3><p className="text-sm text-slate-600">Ahora cada entregable es parte de un hito: se marca en su checklist y se aprueba junto con él.</p><Link href={`/internal/projects/${projectId}/planning/milestones`} className="inline-flex min-h-11 items-center rounded-xl border bg-card px-4 text-sm font-semibold hover:bg-slate-100">Ir a Hitos</Link>{looseDeliverables.length > 0 && <div className="border-t pt-3"><p className="text-xs font-semibold text-amber-800">{looseDeliverables.length} entregable(s) sin hito</p><ul className="mt-1 list-disc pl-5 text-xs text-slate-600">{looseDeliverables.map((item) => <li key={item.id}>{item.title}</li>)}</ul></div>}</aside></div>;
}
