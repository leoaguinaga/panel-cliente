import Link from 'next/link';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import { formatDate, formatMoney, projectStatus } from '../client-formatters';
import { projectAttention } from '../ProjectCard';
import { ROUTES } from '@/lib/constants';
import { isMilestoneDone } from '@/src/modules/projects/types';
import type { ClientPayment, ClientProject } from '../project-helpers';

export type ProjectTab = 'resumen' | 'avance' | 'alcance' | 'pagos';
const TAB_LABEL: Record<ProjectTab, string> = { resumen: 'Resumen', avance: 'Avance', alcance: 'Alcance', pagos: 'Pagos y documentos' };

const DAY = 86_400_000;
function remaining(endDate: string | null, status: string) {
  if (!endDate || status === 'DELIVERED' || status === 'CANCELLED') return null;
  const days = Math.ceil((new Date(endDate).getTime() - Date.now()) / DAY);
  if (days > 1) return `Faltan ${days} días`;
  if (days === 1) return 'Falta 1 día';
  if (days === 0) return 'Entrega prevista hoy';
  return `Fecha estimada superada hace ${-days} día${days === -1 ? '' : 's'}`;
}

const statusPill: Record<string, string> = {
  PLANNING: 'bg-slate-100 text-slate-700', IN_PROGRESS: 'bg-orange-50 text-orange-700', PAUSED: 'bg-amber-50 text-amber-800',
  DELIVERED: 'bg-emerald-50 text-emerald-800', CANCELLED: 'bg-slate-100 text-slate-500',
};

/** Encabezado compacto: lo que espera al cliente se ve en todas las pestañas. */
export function ProjectDetailHeader({ project, payments, tab, tabs, documentsCount }: {
  project: ClientProject; payments: ClientPayment[]; tab: ProjectTab; tabs: ProjectTab[]; documentsCount: number;
}) {
  const base = `/client/projects/${project.id}`;
  const { review, reviewCount, overdue } = projectAttention(project, payments);
  const reviewItems = review ? (project.deliverables ?? []).filter((d) => d.milestone?.id === review.id).length : 0;
  const done = project.milestones.filter((m) => isMilestoneDone(m.status)).length;
  const countdown = remaining(project.estimatedEndDate, project.status);
  const live = project.site?.kind === 'LIVE';
  const banner = review
    ? { label: 'Para tu revisión', text: `«${review.title}»${reviewItems ? ` · ${reviewItems} entregable${reviewItems === 1 ? '' : 's'} esperan tu decisión` : ''}${reviewCount > 1 ? ` · y ${reviewCount - 1} etapa${reviewCount === 2 ? '' : 's'} más` : ''}`, href: `${base}?tab=avance#hito-${review.id}`, cta: 'Revisar y aprobar' }
    : overdue ? { label: 'Pago vencido', text: `${overdue.concept} · ${formatMoney(overdue.amount, overdue.currency)}`, href: `${base}?tab=pagos`, cta: 'Ver pagos' }
    : null;

  return <header className="space-y-5">
    <Link href={ROUTES.client.projects} className="inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-950"><ArrowLeft size={16} />Mis proyectos</Link>

    <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
      <div className="min-w-0">
        <h1 className="text-4xl text-slate-950 sm:text-5xl">{project.name}</h1>
        <dl className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-slate-500 [&_dd]:inline [&_dd]:font-semibold [&_dd]:text-slate-900 [&_dt]:mr-1.5 [&_dt]:inline">
          <div><dt className="sr-only">Estado</dt><dd className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusPill[project.status] || statusPill.PLANNING}`}>{projectStatus[project.status] || project.status}</dd></div>
          {project.startDate && <div><dt>Inicio</dt><dd>{formatDate(project.startDate)}</dd></div>}
          {project.estimatedEndDate && <div><dt>Entrega estimada</dt><dd>{formatDate(project.estimatedEndDate)}</dd>{countdown && <span className="ml-2 text-xs">· {countdown}</span>}</div>}
          {project.milestones.length > 0 && <div><dt>Hitos</dt><dd>{done} de {project.milestones.length}</dd></div>}
          {project.site && <div><a href={project.site.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-slate-800 hover:text-slate-950">{live ? 'Abrir sitio' : 'Abrir demo'}<ArrowUpRight size={14} /></a></div>}
        </dl>
      </div>
      <div className="w-full lg:w-64">
        <div className="mb-1.5 flex justify-between text-sm"><span className="text-slate-500">Avance</span><strong className="text-slate-950">{project.progress}%</strong></div>
        <div className="h-1.5 overflow-hidden rounded-full bg-slate-200" role="progressbar" aria-valuenow={project.progress} aria-valuemin={0} aria-valuemax={100} aria-label="Avance del proyecto"><div className="h-full rounded-full bg-brand" style={{ width: `${project.progress}%` }} /></div>
      </div>
    </div>

    {banner && <div role="status" className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3">
      <p className="min-w-52 flex-1 text-sm text-slate-900"><span className="block text-[11px] font-bold uppercase tracking-wider text-amber-400">{banner.label}</span>{banner.text}</p>
      <Link href={banner.href} className="inline-flex min-h-10 items-center rounded-full bg-brand-button px-4 text-sm font-semibold text-white hover:bg-brand-hover">{banner.cta}</Link>
    </div>}

    <nav aria-label="Secciones del proyecto" className="-mx-4 overflow-x-auto border-b border-slate-200 px-4 [scrollbar-width:none] sm:mx-0 sm:px-0">
      <ul className="flex min-w-max gap-1">{tabs.map((t) => <li key={t}>
        <Link href={`${base}?tab=${t}`} scroll={false} aria-current={t === tab ? 'page' : undefined} className={`-mb-px inline-flex min-h-11 items-center gap-2 border-b-2 px-3.5 text-sm transition-colors ${t === tab ? 'border-brand font-semibold text-slate-950' : 'border-transparent text-slate-500 hover:text-slate-900'}`}>
          <span className="sm:hidden">{t === 'pagos' ? 'Pagos' : TAB_LABEL[t]}</span><span className="hidden sm:inline">{TAB_LABEL[t]}</span>
          {t === 'avance' && reviewCount > 0 && <span className="rounded-full bg-amber-400 px-1.5 text-[11px] font-bold leading-[18px] text-black" aria-label={`${reviewCount} por revisar`}>{reviewCount}</span>}
          {t === 'pagos' && overdue && <span className="size-2 rounded-full bg-red-500" aria-label="Hay un pago vencido" />}
          {t === 'pagos' && !overdue && documentsCount > 0 && <span className="text-xs text-slate-500" aria-hidden="true">{documentsCount}</span>}
        </Link>
      </li>)}</ul>
    </nav>
  </header>;
}
