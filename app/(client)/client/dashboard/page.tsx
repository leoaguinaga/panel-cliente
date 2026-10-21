import Link from 'next/link';
import { ArrowRight, ArrowUpRight, CalendarClock, Check, FileText, FolderKanban, Link2, Paperclip, Video } from 'lucide-react';
import { getClientDashboard } from '@/src/modules/dashboard/server/queries';
import { isMilestoneDone } from '@/src/modules/projects/types';
import { ROUTES } from '@/lib/constants';
import { ProjectSiteCard } from '@/components/client/ProjectSiteCard';
import { formatMoney, projectStatus } from '@/components/client/client-formatters';
import { paymentLabel, short, visibleSteps, type ClientProject } from '@/components/client/project-helpers';

type Project = ClientProject;

const meetingDay = (date: string) => new Intl.DateTimeFormat('es-PE', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(`${date}T00:00:00Z`));
const card = 'rounded-2xl border border-slate-200 bg-card p-5';
/** Sin ?proyecto= se abre el que está en marcha antes que uno en planificación. */
const ACTIVE = ['IN_PROGRESS', 'PLANNING', 'PAUSED'];
const statusPill: Record<string, string> = {
  PLANNING: 'bg-slate-100 text-slate-700', IN_PROGRESS: 'bg-orange-50 text-orange-700', PAUSED: 'bg-amber-50 text-amber-800',
  DELIVERED: 'bg-emerald-50 text-emerald-800', CANCELLED: 'bg-slate-100 text-slate-500',
};

export default async function ClientDashboardPage({ searchParams }: { searchParams: Promise<{ proyecto?: string }> }) {
  const [data, { proyecto }] = await Promise.all([getClientDashboard(), searchParams]);
  const firstName = data.userName.split(' ')[0] || 'de nuevo';
  const project = data.projects.find((p) => p.id === proyecto) ?? ACTIVE.map((status) => data.projects.find((p) => p.status === status)).find(Boolean) ?? data.projects[0];

  if (!project) return <div className="space-y-8">
    <header><h1 className="text-5xl text-slate-950 sm:text-6xl">Hola, <span className="text-brand">{firstName}.</span></h1><p className="mt-2 text-sm leading-6 text-slate-500">Aquí verás el avance de lo que construimos contigo.</p></header>
    <section className="rounded-2xl border border-dashed border-slate-300 bg-card p-10 text-center"><FolderKanban className="mx-auto mb-4 text-slate-500" /><h2 className="font-semibold text-slate-950">Todavía no tienes proyectos activos</h2><p className="mt-2 text-sm text-slate-500">Cuando iniciemos un proyecto aparecerá aquí su avance.</p></section>
  </div>;

  const milestones = project.milestones;
  const deliverables = project.deliverables ?? [];
  const currentIndex = milestones.findIndex((m) => !isMilestoneDone(m.status));
  const allDone = milestones.length > 0 && currentIndex === -1;
  const current = currentIndex >= 0 ? milestones[currentIndex] : null;
  const steps = visibleSteps(milestones, currentIndex === -1 ? milestones.length - 1 : currentIndex);
  const fillIndex = allDone ? steps.length - 1 : steps.findIndex((s) => s.i === currentIndex);
  const fill = steps.length > 1 ? Math.max(0, fillIndex) / (steps.length - 1) * 100 : 0;
  const inReview = milestones.filter((m) => m.status === 'IN_REVIEW');
  const review = inReview[0];
  const reviewItems = review ? deliverables.filter((d) => d.milestone?.id === review.id) : [];
  const lastDelivered = !review ? deliverables.filter((d) => d.completedAt).sort((a, b) => b.completedAt!.localeCompare(a.completedAt!))[0] : undefined;
  const currentItems = current ? deliverables.filter((d) => d.milestone?.id === current.id) : [];
  const approved = milestones.filter((m) => isMilestoneDone(m.status)).reverse();
  const payments = data.payments.filter((p) => p.projectId === project.id && p.status !== 'CANCELLED');
  const meeting = data.meetings.find((m) => m.projectId === project.id);
  const documents = data.documents.filter((d) => d.projectId === project.id).slice(0, 3);
  const company = data.client?.businessName || data.client?.name || 'Tu empresa';
  const detail = `/client/projects/${project.id}`;

  return <div className="space-y-5">
    <header>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span aria-hidden="true" className="grid size-6 place-items-center rounded-md bg-slate-950 text-xs font-extrabold text-background">{company[0]?.toUpperCase()}</span>
        <b className="font-semibold text-slate-950">{company}</b><span className="text-slate-400">/</span>
        <Link href={detail} className="text-slate-600 hover:text-slate-950">{project.name}</Link>
        <span className={`ml-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${statusPill[project.status] || statusPill.PLANNING}`}><span className="size-1.5 rounded-full bg-current" />{projectStatus[project.status] || project.status}</span>
      </div>
      {data.projects.length > 1 && <nav aria-label="Tus proyectos" className="mt-3 flex flex-wrap gap-2">{data.projects.map((p) => <Link key={p.id} href={`?proyecto=${p.id}`} aria-current={p.id === project.id ? 'page' : undefined} className={`rounded-full border px-3 py-1 text-xs font-medium ${p.id === project.id ? 'border-brand bg-orange-50 text-slate-950' : 'border-slate-200 text-slate-500 hover:text-slate-900'}`}>{p.name}</Link>)}</nav>}
      <h1 className="mt-6 text-5xl text-slate-950 sm:text-6xl">Hola, <span className="text-brand">{firstName}.</span></h1>
      <p className="mt-2 text-sm leading-6 text-slate-500">
        {allDone ? 'Completamos todas las etapas de tu proyecto.' : current ? <>Tu proyecto está en <b className="font-semibold text-slate-900">{current.title}</b>.</> : 'Estamos preparando las etapas de tu proyecto.'}
        {inReview.length > 0 && <> Tienes {inReview.length === 1 ? '1 entrega' : `${inReview.length} entregas`} por revisar.</>}
      </p>
    </header>

    <div className="grid gap-5 lg:grid-cols-[1.25fr_1fr]">
      <section aria-labelledby="progress-title" className={`${card} flex flex-col`}>
        <div className="flex items-baseline justify-between gap-3"><h2 id="progress-title" className="text-[15px] font-semibold text-slate-950">Avance del proyecto</h2>{project.estimatedEndDate && <span className="text-xs text-slate-500">Entrega estimada · {short(project.estimatedEndDate)}</span>}</div>
        {steps.length ? <>
          <div className="relative mx-2 mb-2 mt-6 h-4" aria-hidden="true">
            <span className="absolute inset-x-0 top-[7px] h-0.5 bg-slate-200" />
            <span className="absolute left-0 top-[7px] h-0.5 bg-brand" style={{ width: `${fill}%` }} />
            {steps.map(({ m, i }, k) => {
              const left = steps.length > 1 ? k / (steps.length - 1) * 100 : 0; const done = isMilestoneDone(m.status); const now = i === currentIndex;
              return <span key={m.id} className={`absolute -translate-x-1/2 rounded-full border-2 ${now ? 'top-[-1px] size-[18px] border-[3px] border-brand bg-background shadow-[0_0_0_6px_rgb(238_77_49/0.15)]' : done ? 'top-0.5 size-3 border-brand bg-brand' : 'top-0.5 size-3 border-slate-400 bg-background'}`} style={{ left: `${left}%` }} />;
            })}
          </div>
          <ol className="grid text-xs" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
            {steps.map(({ m, i }, k) => {
              const done = isMilestoneDone(m.status); const now = i === currentIndex; const align = steps.length === 1 || k === 0 ? 'items-start text-left' : k === steps.length - 1 ? 'items-end text-right' : 'items-center text-center';
              return <li key={m.id} className={`flex min-w-0 flex-col ${align}`}><b className={`max-w-full truncate font-semibold ${now ? 'text-slate-950' : 'text-slate-700'}`} title={m.title}>{m.title}</b><small className={now ? 'text-orange-700' : 'text-slate-500'}>{done ? short(m.completedAt || m.approvedAt) || 'Hecho' : now ? (m.status === 'IN_REVIEW' ? 'Por revisar' : 'En curso') : short(m.dueDate) || 'Pendiente'}</small></li>;
            })}
          </ol>
        </> : <p className="mt-4 text-sm text-slate-500">Pronto publicaremos las etapas del proyecto.</p>}

        {current && <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-orange-700">Ahora mismo · {current.title}</p>
          {current.description && <p className="mt-1 text-sm text-slate-700">{current.description}</p>}
          {currentItems.length > 0 && <ul className="mt-3 grid gap-1.5 text-sm">{currentItems.map((d) => <li key={d.id} className={`flex items-center gap-2 ${d.done ? 'text-slate-700' : 'text-slate-500'}`}>{d.done ? <Check size={15} className="shrink-0 text-emerald-500" /> : <span className="size-[13px] shrink-0 rounded-full border-2 border-slate-400" />}<span className="truncate">{d.title}</span></li>)}</ul>}
          {!current.description && !currentItems.length && <p className="mt-1 text-sm text-slate-500">Estamos trabajando en esta etapa.</p>}
        </div>}

        <div className="mt-auto pt-5"><dl className="flex flex-wrap gap-x-5 gap-y-1 border-t border-slate-200 pt-4 text-xs text-slate-500 [&_dd]:inline [&_dd]:font-semibold [&_dd]:text-slate-900 [&_dt]:mr-1 [&_dt]:inline">
          <div><dt>Progreso</dt><dd>{project.progress}%</dd></div>
          <div><dt>Actualizado</dt><dd>{short(project.updatedAt)}</dd></div>
        </dl></div>
      </section>

      <ProjectSiteCard projectId={project.id} site={project.site} launchDate={project.estimatedEndDate} />
    </div>

    <div className="grid gap-5 lg:grid-cols-[1.25fr_1fr]">
      <section aria-labelledby="done-title" className={card}>
        <div className="flex items-baseline justify-between gap-3"><h2 id="done-title" className="text-[15px] font-semibold text-slate-950">Entregado hasta ahora</h2><Link href={detail} className="text-xs font-semibold text-slate-600 hover:text-slate-950">Ver proyecto</Link></div>
        {approved.length ? <ul className="mt-2 divide-y divide-slate-200">{approved.slice(0, 4).map((m) => {
          const items = deliverables.filter((d) => d.milestone?.id === m.id); const files = items.reduce((n, d) => n + (d.attachments?.length ?? 0) + (d.document ? 1 : 0), 0);
          return <li key={m.id}><Link href={`${detail}?tab=avance#hito-${m.id}`} className="flex items-center gap-3 py-3 text-sm"><span className="grid size-8 shrink-0 place-items-center rounded-lg border border-slate-200 bg-slate-50 text-emerald-500"><Check size={15} /></span><span className="min-w-0 flex-1"><b className="block truncate font-medium text-slate-900">{m.title}</b><small className="text-xs text-slate-500">{short(m.completedAt || m.approvedAt) || 'Aprobado'}{items.length ? ` · ${items.length} entregable${items.length === 1 ? '' : 's'}` : ''}{files ? ` · ${files} adjunto${files === 1 ? '' : 's'}` : ''}</small></span><ArrowRight size={15} className="text-slate-400" /></Link></li>;
        })}</ul>
          : <p className="mt-3 text-sm text-slate-500">Cuando apruebes la primera etapa, la verás aquí con todo lo entregado.</p>}
      </section>

      <section aria-labelledby="payments-title" className={card}>
        <div className="flex items-baseline justify-between gap-3"><h2 id="payments-title" className="text-[15px] font-semibold text-slate-950">Pagos</h2><Link href={ROUTES.client.payments} className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-950">Ver pagos<ArrowUpRight size={13} /></Link></div>
        {payments.length ? <ul className="mt-3 grid gap-3">{payments.slice(0, 4).map((p) => {
          const label = paymentLabel(p, milestones);
          return <li key={p.id} className="grid grid-cols-[1fr_auto] gap-x-3 text-sm"><b className="truncate font-semibold text-slate-900">{p.concept}</b><span className={`text-xs font-semibold ${label.tone}`}>{p.status === 'PAID' && <Check size={13} className="mr-1 inline" />}{label.text}</span><span className="text-xs text-slate-500">{formatMoney(p.amount, p.currency)}</span></li>;
        })}</ul>
          : <p className="mt-3 text-sm text-slate-500">Este proyecto no tiene pagos programados.</p>}
        <div className="mt-4 border-t border-slate-200 pt-3 text-sm">
          <p className="flex items-center gap-2 font-semibold text-slate-900"><CalendarClock size={15} className="text-slate-500" />Próxima reunión</p>
          {meeting ? <p className="mt-1 text-xs text-slate-500"><span className="capitalize">{meetingDay(meeting.date)}</span>{meeting.time && ` · ${meeting.time}`} · {meeting.title}{meeting.meetUrl && <> · <a href={meeting.meetUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-slate-800 hover:text-slate-950"><Video size={13} />Unirse</a></>}</p>
            : <p className="mt-1 text-xs text-slate-500">No hay reuniones agendadas.</p>}
        </div>
      </section>
    </div>

    <div className="grid gap-5 lg:grid-cols-[1.25fr_1fr]">
      {/* <section aria-labelledby="review-title" className={card}>
        <div className="flex items-center justify-between gap-3"><h2 id="review-title" className="text-[15px] font-semibold text-slate-950">{review || !lastDelivered ? 'Para tu revisión' : 'Último entregable'}</h2>{review && <span className="rounded-full bg-brand px-2 py-0.5 text-[11px] font-bold text-white">Nuevo</span>}</div>
        {review ? <>
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="min-w-0 flex-1"><b className="block text-sm font-semibold text-slate-950">{review.title}</b><span className="text-xs text-slate-500">{review.reviewRequestedAt ? `Enviado el ${short(review.reviewRequestedAt)}` : 'Listo para revisar'}{reviewItems.length ? ` · ${reviewItems.length} entregable${reviewItems.length === 1 ? '' : 's'}` : ''}</span></div>
            <Link href={`${detail}?tab=avance#hito-${review.id}`} className="inline-flex min-h-10 items-center gap-1.5 whitespace-nowrap rounded-full bg-brand-button px-4 text-sm font-semibold text-white hover:bg-brand-hover">Revisar<ArrowRight size={15} /></Link>
          </div>
          <Attachments items={reviewItems} />
          {inReview.length > 1 && <p className="mt-3 text-xs text-slate-500">Y {inReview.length - 1} más esperando tu revisión.</p>}
        </> : lastDelivered ? <>
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3"><b className="block text-sm font-semibold text-slate-950">{lastDelivered.title}</b><span className="text-xs text-slate-500">Entregado el {short(lastDelivered.completedAt)}{lastDelivered.milestone ? ` · ${lastDelivered.milestone.title}` : ''}</span></div>
          <Attachments items={[lastDelivered]} />
        </> : <p className="mt-4 text-sm text-slate-500">Nada pendiente de ti por ahora. Te avisaremos cuando haya algo que revisar.</p>}
      </section> */}

      {/* <section aria-labelledby="docs-title" className={card}>
        <div className="flex items-baseline justify-between gap-3"><h2 id="docs-title" className="text-[15px] font-semibold text-slate-950">Documentos recientes</h2><Link href={ROUTES.client.documents} className="text-xs font-semibold text-slate-600 hover:text-slate-950">Ver todos</Link></div>
        {documents.length ? <ul className="mt-3 grid gap-2">{documents.map((d) => <li key={d.id}><a href={`/api/backend/documents/${d.id}/download`} className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5 text-sm hover:bg-slate-100"><FileText size={16} className="shrink-0 text-slate-500" /><span className="min-w-0 flex-1 truncate text-slate-800">{d.originalName}</span><span className="text-xs text-slate-500">{short(d.createdAt)}</span></a></li>)}</ul>
          : <p className="mt-3 text-sm text-slate-500">Aún no hay documentos compartidos contigo.</p>}
      </section> */}
    </div>
  </div>;
}

/** Adjuntos de los entregables como etiquetas: staging, API, Figma, archivos. */
function Attachments({ items }: { items: NonNullable<Project['deliverables']> }) {
  const chips = items.flatMap((d) => [
    ...(d.document && !d.document.archivedAt ? [{ id: `doc-${d.id}`, title: d.document.originalName, href: `/api/backend/documents/${d.document.id}/download`, link: false }] : []),
    ...(d.attachments ?? []).flatMap((a) => {
      const doc = a.document && !a.document.archivedAt ? a.document : null;
      const href = doc ? `/api/backend/documents/${doc.id}/download` : a.kind === 'LINK' ? a.url : null;
      return href ? [{ id: a.id, title: a.title, href, link: a.kind === 'LINK' }] : [];
    }),
  ]);
  if (!chips.length) return null;
  return <ul className="mt-3 flex flex-wrap gap-2">{chips.slice(0, 6).map((c) => <li key={c.id}><a href={c.href!} target={c.link ? '_blank' : undefined} rel="noopener noreferrer" className="inline-flex max-w-64 items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-700 hover:border-slate-300 hover:text-slate-950">{c.link ? <Link2 size={13} className="shrink-0" /> : <Paperclip size={13} className="shrink-0" />}<span className="truncate">{c.title}</span></a></li>)}</ul>;
}
