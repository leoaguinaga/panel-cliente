'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { ExternalLink, Globe, RefreshCw, Rocket, Trash2 } from 'lucide-react';
import { deleteProjectSiteAction, refreshProjectSiteAction, saveProjectSiteAction } from '@/src/modules/projects/server/actions';
import type { ProjectSite } from '@/src/modules/dashboard/server/queries';

const field = 'mt-1 w-full rounded-xl border bg-slate-50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600';
const preview: Record<ProjectSite['ogStatus'], { label: string; tone: string }> = {
  PENDING: { label: 'Leyendo vista previa…', tone: 'text-slate-500' },
  OK: { label: 'Vista previa lista', tone: 'text-emerald-700' },
  NO_IMAGE: { label: 'Sin imagen OG', tone: 'text-amber-700' },
  FAILED: { label: 'No se pudo leer', tone: 'text-red-700' },
};

/** Único enlace del proyecto que ve el cliente; staging, API, etc. van como adjuntos de entregables. */
export function ProjectSiteManager({ projectId, projectStatus, site: initial }: { projectId: string; projectStatus: string; site: ProjectSite | null }) {
  const [site, setSite] = useState(initial);
  // En planificación todavía no hay qué mostrar: el formulario espera a que lo pidan
  const [editing, setEditing] = useState(!initial && projectStatus !== 'PLANNING');
  const [kind, setKind] = useState<'LIVE' | 'DEMO'>(initial?.kind ?? 'DEMO');
  const [pending, startTransition] = useTransition();
  // Al entregar el proyecto, la demo debería dar paso al sitio en vivo
  const suggestLive = projectStatus === 'DELIVERED' && site?.kind === 'DEMO';

  function run(label: string, action: () => ReturnType<typeof saveProjectSiteAction>, done?: () => void) {
    startTransition(async () => {
      const id = toast.loading(label);
      const result = await action();
      if (!result.ok) return void toast.error('No se pudo completar', { id, description: result.error });
      setSite(result.site);
      done?.();
      const status = result.site?.ogStatus;
      if (!result.site) toast.success('Enlace quitado', { id });
      else if (status === 'OK') toast.success('Enlace guardado', { id, description: 'La vista previa ya está lista para el cliente.' });
      else toast.warning('Enlace guardado sin vista previa', { id, description: result.site.ogError || 'El cliente verá una tarjeta con el dominio.' });
    });
  }

  function save(formData: FormData) {
    const body = { url: String(formData.get('url') || '').trim(), kind, comment: String(formData.get('comment') || '').trim() };
    run('Guardando enlace y leyendo la vista previa…', () => saveProjectSiteAction(projectId, body), () => setEditing(false));
  }

  return <article aria-labelledby="site-card-title" className="rounded-2xl border bg-card p-5">
    <div className="flex flex-wrap items-baseline justify-between gap-3">
      <div><h3 id="site-card-title" className="text-sm font-bold text-slate-900">Enlace del proyecto</h3><p className="mt-1 text-xs text-slate-500">Lo que el cliente abre desde su inicio: el sitio en vivo o la demo. Staging, API y similares van como adjuntos de los entregables.</p></div>
      {site && !editing && <button type="button" onClick={() => { setKind(site.kind); setEditing(true); }} className="text-xs font-semibold text-slate-600 hover:text-slate-900">Editar</button>}
      {!site && !editing && <button type="button" onClick={() => setEditing(true)} className="text-xs font-semibold text-slate-600 hover:text-slate-900">Agregar enlace</button>}
    </div>

    {suggestLive && !editing && <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-orange-200 bg-orange-50 p-3 text-sm">
      <Rocket className="size-4 shrink-0 text-orange-700" /><p className="min-w-0 flex-1 text-slate-800">El proyecto se entregó y el enlace sigue siendo la demo. ¿Cambiarlo a la versión en vivo?</p>
      <button type="button" onClick={() => { setKind('LIVE'); setEditing(true); }} className="min-h-10 rounded-xl bg-blue-600 px-3 text-xs font-semibold text-white">Cambiar a en vivo</button>
    </div>}

    {editing ? <form onSubmit={(event) => { event.preventDefault(); if (!pending) save(new FormData(event.currentTarget)); }} aria-busy={pending} className="mt-4 grid gap-4">
      <fieldset className="flex flex-wrap gap-2"><legend className="mb-1 text-xs font-semibold text-slate-700">Tipo</legend>
        {(['DEMO', 'LIVE'] as const).map((value) => <label key={value} className={`inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border px-3 text-sm ${kind === value ? 'border-blue-600 bg-blue-50 font-semibold text-slate-900' : 'text-slate-600'}`}><input type="radio" name="kind" value={value} checked={kind === value} onChange={() => setKind(value)} className="sr-only" />{value === 'LIVE' ? 'En vivo' : 'Demo'}</label>)}
      </fieldset>
      <label className="block text-xs font-semibold text-slate-700">URL<input name="url" type="url" required maxLength={2000} placeholder="https://demo.acme.pe" defaultValue={site?.url ?? ''} className={field} /></label>
      <label className="block text-xs font-semibold text-slate-700">Nota para el cliente <span className="font-normal text-slate-500">(opcional, nunca contraseñas)</span><textarea name="comment" rows={2} maxLength={500} placeholder="Datos de prueba: las reservas no llegan al restaurante." defaultValue={site?.comment ?? ''} className={field} /></label>
      <div className="flex flex-wrap justify-end gap-2">
        {(site || projectStatus === 'PLANNING') && <button type="button" disabled={pending} onClick={() => setEditing(false)} className="min-h-11 rounded-xl border px-4 text-sm font-semibold text-slate-700 hover:bg-slate-100">Cancelar</button>}
        <button type="submit" disabled={pending} className="min-h-11 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-60">{pending ? 'Guardando…' : 'Guardar enlace'}</button>
      </div>
    </form> : site && <div className="mt-4 grid gap-4 sm:grid-cols-[14rem_1fr]">
      <div className="aspect-[1200/630] overflow-hidden rounded-xl border bg-slate-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {site.hasImage ? <img src={`/api/backend/projects/${projectId}/site/image?v=${site.version}`} alt="Vista previa del enlace" className="h-full w-full object-cover" /> : <span className="grid h-full place-items-center text-slate-400"><Globe className="size-6" /></span>}
      </div>
      <div className="min-w-0 space-y-1 text-sm">
        <p className="flex items-center gap-2"><span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${site.kind === 'LIVE' ? 'bg-emerald-50 text-emerald-800' : 'bg-orange-50 text-orange-800'}`}>{site.kind === 'LIVE' ? 'En vivo' : 'Demo'}</span><a href={site.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-w-0 items-center gap-1 truncate font-medium text-slate-900 hover:underline">{site.url}<ExternalLink className="size-3.5 shrink-0" /></a></p>
        {site.ogTitle && <p className="font-semibold text-slate-800">{site.ogTitle}</p>}
        {site.comment && <p className="text-xs text-slate-600">Nota: {site.comment}</p>}
        <p className={`text-xs font-medium ${preview[site.ogStatus].tone}`}>{preview[site.ogStatus].label}{site.ogError && site.ogStatus !== 'OK' ? ` · ${site.ogError}` : ''}</p>
        <div className="flex flex-wrap gap-2 pt-2">
          <button type="button" disabled={pending} onClick={() => run('Leyendo la vista previa…', () => refreshProjectSiteAction(projectId))} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-60"><RefreshCw className="size-3.5" />Actualizar vista previa</button>
          <button type="button" disabled={pending} onClick={() => { if (confirm('¿Quitar el enlace del proyecto? El cliente dejará de verlo en su inicio.')) run('Quitando enlace…', () => deleteProjectSiteAction(projectId), () => { setEditing(true); setKind('DEMO'); }); }} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl px-3 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"><Trash2 className="size-3.5" />Quitar</button>
        </div>
      </div>
    </div>}
    {!site && !editing && <p className="mt-3 text-sm text-slate-600">Todavía no hay enlace. Agrégalo cuando haya una demo que mostrar.</p>}
  </article>;
}
