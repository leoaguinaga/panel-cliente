import Link from 'next/link';
import { ArrowRight, ArrowUpRight, Globe } from 'lucide-react';
import { isMilestoneDone } from '@/src/modules/projects/types';
import { formatMoney, projectStatus } from './client-formatters';
import { paymentLabel, short, visibleSteps, type ClientPayment, type ClientProject } from './project-helpers';

const statusPill: Record<string, string> = {
  PLANNING: 'bg-slate-100 text-slate-700', IN_PROGRESS: 'bg-orange-50 text-orange-700', PAUSED: 'bg-amber-50 text-amber-800',
  DELIVERED: 'bg-emerald-50 text-emerald-800', CANCELLED: 'bg-slate-100 text-slate-500',
};

const domain = (url: string) => { try { return new URL(url).host.replace(/^www\./, ''); } catch { return url; } };
const assetUrl = (p: ClientProject) => `/api/backend/projects/${p.id}/site/image?v=${p.site?.version ?? 0}`;

/** Lo que el cliente debe mirar en este proyecto: hito por revisar o pago vencido. */
export function projectAttention(project: ClientProject, payments: ClientPayment[]) {
  const review = project.milestones.find((m) => m.status === 'IN_REVIEW');
  const reviewCount = project.milestones.filter((m) => m.status === 'IN_REVIEW').length;
  const overdue = payments.find((p) => p.status === 'OVERDUE');
  return { review, reviewCount, overdue, needsAttention: Boolean(review || overdue) };
}

/** Vista previa: og:image copiada, o monograma del host, o «aún no está en línea». */
function Preview({ project, compact = false }: { project: ClientProject; compact?: boolean }) {
  const site = project.site;
  if (!site) return <div className={`absolute inset-0 grid place-items-center bg-[repeating-linear-gradient(135deg,rgb(255_255_241/0.04)_0_10px,transparent_10px_20px)] text-center ${compact ? '' : 'px-6'}`}>
    <div><Globe className="mx-auto text-slate-400" size={compact ? 16 : 22} />{!compact && <><p className="mt-2 text-sm font-medium text-slate-800">Aún no está en línea</p><p className="mt-1 text-xs text-slate-500">{project.estimatedEndDate ? `Lanzamiento estimado: ${short(project.estimatedEndDate)}` : 'Te avisaremos cuando puedas verlo.'}</p></>}</div>
  </div>;
  if (site.hasImage) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={assetUrl(project)} alt="" loading="lazy" className="absolute inset-0 size-full object-cover object-center transition duration-300 motion-safe:group-hover:scale-[1.03]" />;
  }
  return <span className={`absolute inset-0 grid place-items-center bg-[radial-gradient(circle_at_30%_20%,rgb(238_77_49/0.35),transparent_60%)] text-center font-display tracking-wide text-slate-900 ${compact ? 'px-1 text-[11px]' : 'px-6 text-3xl'}`}>{domain(site.url).toUpperCase()}</span>;
}

export function ProjectCard({ project, payments }: { project: ClientProject; payments: ClientPayment[] }) {
  const { milestones, site } = project;
  const detail = `/client/projects/${project.id}`;
  const { review, reviewCount, overdue, needsAttention } = projectAttention(project, payments);
  const currentIndex = milestones.findIndex((m) => !isMilestoneDone(m.status));
  const allDone = milestones.length > 0 && currentIndex === -1;
  const current = currentIndex >= 0 ? milestones[currentIndex] : null;
  const steps = visibleSteps(milestones, allDone ? milestones.length - 1 : Math.max(0, currentIndex));
  const reviewItems = review ? (project.deliverables ?? []).filter((d) => d.milestone?.id === review.id).length : 0;
  const live = site?.kind === 'LIVE';
  const nextPayment = overdue ?? payments.find((p) => p.status === 'UNDER_REVIEW') ?? null;

  const now = review
    ? { tone: 'warn', label: 'Para tu revisión', text: `«${review.title}» está lista${reviewItems ? ` · ${reviewItems} entregable${reviewItems === 1 ? '' : 's'} esperan tu aprobación` : ''}${reviewCount > 1 ? ` · y ${reviewCount - 1} etapa${reviewCount === 2 ? '' : 's'} más` : ''}` }
    : project.status === 'PAUSED' ? { tone: 'plain', label: 'En pausa', text: 'Tu equipo retomará el trabajo y te avisará.' }
    : current ? { tone: 'plain', label: 'Ahora mismo', text: current.description ? `${current.title} · ${current.description}` : current.title }
    : allDone ? { tone: 'plain', label: 'Listo', text: 'Completamos todas las etapas.' }
    : { tone: 'plain', label: 'Ahora mismo', text: 'Estamos preparando el plan del proyecto.' };

  return <article className={`group relative grid overflow-hidden rounded-2xl border bg-card transition-colors md:grid-cols-[minmax(0,22rem)_1fr] ${needsAttention ? 'border-amber-500/40 hover:border-amber-500/70' : 'border-slate-200 hover:border-slate-300'}`}>
    <div className="relative aspect-[1200/630] overflow-hidden border-b border-slate-200 bg-slate-100 md:aspect-auto md:min-h-48 md:border-b-0 md:border-r">
      <Preview project={project} />
      {site && <span className={`absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-bold backdrop-blur ${live ? 'text-emerald-400' : 'text-orange-300'}`}><span className="size-1.5 rounded-full bg-current" />{live ? 'En vivo' : 'Demo'}</span>}
      {site && <span className="absolute bottom-3 left-3 max-w-[85%] truncate rounded-lg bg-black/60 px-2 py-0.5 text-xs text-white">{domain(site.url)}</span>}
    </div>

    <div className="flex min-w-0 flex-col gap-3.5 p-5 sm:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="min-w-0 text-lg font-semibold text-slate-950"><Link href={detail} className="truncate after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-brand focus-visible:after:ring-inset" title={project.name}>{project.name}</Link></h2>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusPill[project.status] || statusPill.PLANNING}`}>{projectStatus[project.status] || project.status}</span>
      </div>
      {project.description && <p className="line-clamp-2 text-sm text-slate-500">{project.description}</p>}

      {steps.length > 1 && <div aria-label="Etapas del proyecto">
        <ol className="flex items-center" aria-hidden="true">{steps.map(({ m, i }, k) => { const done = isMilestoneDone(m.status); const isNow = i === currentIndex;
          return <li key={m.id} className="flex flex-1 items-center last:flex-none">
            <span className={`shrink-0 rounded-full border-2 ${isNow ? 'size-3.5 border-[3px] border-brand bg-background shadow-[0_0_0_5px_rgb(238_77_49/0.15)]' : done || allDone ? 'size-2.5 border-brand bg-brand' : 'size-2.5 border-slate-400 bg-background'}`} />
            {k < steps.length - 1 && <span className={`mx-0.5 h-0.5 flex-1 ${done ? 'bg-brand' : 'bg-slate-200'}`} />}
          </li>; })}</ol>
        <ol className="mt-1.5 grid text-xs text-slate-500" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>{steps.map(({ m, i }, k) =>
          <li key={m.id} className={`truncate ${k === 0 ? 'text-left' : k === steps.length - 1 ? 'text-right' : 'text-center'} ${i === currentIndex ? 'font-semibold text-slate-950' : ''}`} title={m.title}>{m.title}</li>)}</ol>
      </div>}

      <div className={`rounded-xl border px-3.5 py-2.5 text-sm ${now.tone === 'warn' ? 'border-amber-500/30 bg-amber-500/10 text-slate-800' : 'border-slate-200 bg-slate-50 text-slate-700'}`}>
        <p className={`text-[11px] font-bold uppercase tracking-wider ${now.tone === 'warn' ? 'text-amber-400' : 'text-orange-700'}`}>{now.label}</p>
        <p className="mt-0.5 line-clamp-2">{now.text}</p>
      </div>

      <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-3">
        {review && <Link href={`${detail}?tab=avance#hito-${review.id}`} className="relative z-10 inline-flex min-h-10 items-center gap-1.5 rounded-full bg-brand-button px-4 text-sm font-semibold text-white hover:bg-brand-hover">Revisar y aprobar</Link>}
        {!review && <Link href={detail} tabIndex={-1} className="relative z-10 inline-flex min-h-10 items-center gap-1.5 rounded-full bg-brand-button px-4 text-sm font-semibold text-white hover:bg-brand-hover">Ver proyecto<ArrowRight size={15} /></Link>}
        {site && <a href={site.url} target="_blank" rel="noopener noreferrer" className={`relative z-10 inline-flex min-h-10 items-center gap-1.5 rounded-full border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:border-slate-400 hover:text-slate-950`}>{live ? 'Abrir sitio' : 'Abrir demo'}<ArrowUpRight size={15} /></a>}
        <dl className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 sm:ml-auto [&_dd]:inline [&_dd]:font-semibold [&_dd]:text-slate-900 [&_dt]:mr-1 [&_dt]:inline">
          {project.estimatedEndDate && <div><dt>Entrega estimada</dt><dd>{short(project.estimatedEndDate)}</dd></div>}
          {nextPayment && <div><dt>Pago</dt><dd className={paymentLabel(nextPayment, milestones).tone}>{formatMoney(nextPayment.amount, nextPayment.currency)} · {paymentLabel(nextPayment, milestones).text}</dd></div>}
          <div className="flex items-center gap-2"><dt className="sr-only">Avance</dt><span aria-hidden="true" className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-200"><span className="block h-full bg-brand" style={{ width: `${project.progress}%` }} /></span><dd>{project.progress}%</dd></div>
        </dl>
      </div>
    </div>
  </article>;
}

/** Fila compacta para proyectos entregados. */
export function DeliveredRow({ project }: { project: ClientProject }) {
  const last = project.milestones.filter((m) => isMilestoneDone(m.status)).map((m) => m.approvedAt || m.completedAt).filter(Boolean).sort().at(-1);
  const when = short(last || project.updatedAt);
  return <li className="group relative flex items-center gap-4 rounded-xl border border-slate-200 bg-card p-3 transition-colors hover:border-slate-300">
    <div className="relative aspect-[1200/630] w-24 shrink-0 overflow-hidden rounded-lg bg-slate-100"><Preview project={project} compact /></div>
    <div className="min-w-0 flex-1"><Link href={`/client/projects/${project.id}`} className="block truncate text-sm font-semibold text-slate-950 after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-brand focus-visible:after:ring-inset">{project.name}</Link>
      <p className="truncate text-xs text-slate-500">Entregado el {when}{project.site ? ` · ${project.site.kind === 'LIVE' ? 'en vivo' : 'demo'}` : ''}</p></div>
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusPill.DELIVERED}`}>Entregado</span>
  </li>;
}
