import { ArrowUpRight, Globe } from 'lucide-react';
import type { ProjectSite } from '@/src/modules/dashboard/server/queries';
import { CopyLinkButton } from './CopyLinkButton';
import { formatDate } from './client-formatters';

const domain = (url: string) => { try { return new URL(url).host.replace(/^www\./, ''); } catch { return url; } };

/** Único enlace del proyecto (en vivo o demo) con la vista previa OG copiada en nuestro storage. */
export function ProjectSiteCard({ projectId, site, launchDate, className = '' }: { projectId: string; site: ProjectSite | null; launchDate: string | null; className?: string }) {
  if (!site) return <section aria-label="Enlace del proyecto" className={`flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-card ${className}`}>
    <div className="grid aspect-[1200/630] place-items-center border-b border-dashed border-slate-200 bg-[repeating-linear-gradient(135deg,rgb(255_255_241/0.04)_0_10px,transparent_10px_20px)] px-6 text-center">
      <div><Globe className="mx-auto mb-3 text-slate-400" size={22} /><p className="text-sm font-medium text-slate-800">Aún no está en línea</p><p className="mt-1 text-xs text-slate-500">{launchDate ? `Lanzamiento estimado: ${formatDate(launchDate)}` : 'Te avisaremos cuando puedas verlo.'}</p></div>
    </div>
    <p className="p-5 text-sm text-slate-500">Cuando tengamos una demo o el sitio publicado, aparecerá aquí.</p>
  </section>;

  const host = domain(site.url);
  const live = site.kind === 'LIVE';
  const asset = (name: 'image' | 'favicon') => `/api/backend/projects/${projectId}/site/${name}?v=${site.version}`;
  return <section aria-label="Enlace del proyecto" className={`flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-card ${className}`}>
    <a href={site.url} target="_blank" rel="noopener noreferrer" className="relative block aspect-[1200/630] overflow-hidden border-b border-slate-200 bg-slate-100" tabIndex={-1} aria-hidden="true">
      {site.hasImage
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={asset('image')} alt="" className="h-full w-full object-cover" loading="lazy" />
        : <span className="grid h-full place-items-center bg-[radial-gradient(circle_at_30%_20%,rgb(238_77_49/0.35),transparent_60%)] px-6 text-center font-display text-4xl tracking-wide text-slate-900">{host.toUpperCase()}</span>}
      <span className={`absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-bold backdrop-blur ${live ? 'text-emerald-400' : 'text-orange-300'}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{live ? 'En vivo' : 'Demo'}</span>
    </a>
    <div className="flex flex-1 flex-col gap-1 p-5">
      <p className="flex items-center gap-2 text-xs text-slate-500">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {site.hasFavicon ? <img src={asset('favicon')} alt="" className="size-4 rounded" /> : <Globe size={14} />}
        <span className="truncate">{host}</span>
      </p>
      <h2 className="text-base font-semibold text-slate-950">{site.ogTitle || (live ? 'Tu sitio en vivo' : 'Demo de tu proyecto')}</h2>
      {site.ogDescription && <p className="line-clamp-2 text-sm text-slate-500">{site.ogDescription}</p>}
      {site.comment && <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-700"><span className="text-slate-500">Nota del equipo · </span>{site.comment}</p>}
      <div className="mt-auto flex flex-wrap gap-2 pt-4">
        <a href={site.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-brand-button px-4 text-sm font-semibold text-white hover:bg-brand-hover">{live ? 'Abrir sitio' : 'Abrir demo'}<ArrowUpRight size={15} /></a>
        <CopyLinkButton url={site.url} />
      </div>
    </div>
  </section>;
}
