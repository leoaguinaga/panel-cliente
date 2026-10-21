import Link from 'next/link';
import { ArrowRight, Check, Download, FileText } from 'lucide-react';
import { DeliverableAttachmentList } from '@/components/projects/DeliverableAttachmentList';
import { ScopeColumns } from '@/components/projects/ScopeColumns';
import { ClientProjectTimeline } from '../ClientProjectTimeline';
import { ClientMilestoneDecision } from '../ClientMilestoneDecision';
import { ProjectSiteCard } from '../ProjectSiteCard';
import { documentType, formatDate, formatMoney, milestoneStatus, paymentStatus, paymentStatusStyles } from '../client-formatters';
import type { ClientDashboard } from '@/src/modules/dashboard/server/queries';
import { paymentLabel, short, type ClientMilestone, type ClientPayment, type ClientProject } from '../project-helpers';
import { isMilestoneDone } from '@/src/modules/projects/types';
import { ROUTES } from '@/lib/constants';

type Doc = ClientDashboard['documents'][number];
type Deliverable = NonNullable<ClientProject['deliverables']>[number];
const card = 'rounded-2xl border border-slate-200 bg-card p-5 sm:p-6';
const h2 = 'text-base font-semibold text-slate-950';
const attachmentsOf = (d: Deliverable) => [...(d.document ? [{ id: `legacy-${d.id}`, kind: 'DOCUMENT', title: d.document.originalName, document: d.document }] : []), ...(d.attachments ?? [])];

function CardHead({ title, href, label }: { title: string; href?: string; label?: string }) {
  return <div className="mb-4 flex items-baseline justify-between gap-3"><h2 className={h2}>{title}</h2>{href && <Link href={href} className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-950">{label}<ArrowRight size={13} /></Link>}</div>;
}

/** Resumen: dónde estamos, el enlace del proyecto, lo que sigue y el próximo pago. */
export function SummaryView({ project, payments }: { project: ClientProject; payments: ClientPayment[] }) {
  const base = `/client/projects/${project.id}`;
  const { milestones } = project;
  const currentIndex = milestones.findIndex((m) => !isMilestoneDone(m.status));
  const current = currentIndex >= 0 ? milestones[currentIndex] : null;
  const upcoming = currentIndex >= 0 ? milestones.slice(currentIndex + 1, currentIndex + 4) : [];
  const approved = milestones.filter((m) => isMilestoneDone(m.status)).reverse().slice(0, 3);
  const nextPayment = payments.find((p) => p.status !== 'PAID' && p.status !== 'CANCELLED');
  const label = nextPayment ? paymentLabel(nextPayment, milestones) : null;
  return <div className="grid gap-5 lg:grid-cols-[1.25fr_1fr]">
    <div className="space-y-5">
      <section className={card} aria-labelledby="now-title">
        <CardHead title="Ahora mismo" href={`${base}?tab=avance`} label="Ver avance" />
        {current ? <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-orange-700">{current.status === 'IN_REVIEW' ? 'Esperando tu revisión' : milestoneStatus[current.status] || 'Etapa actual'}</p>
          <p id="now-title" className="mt-1 text-sm font-semibold text-slate-950">{current.title}</p>
          {current.description && <p className="mt-1 text-sm text-slate-600">{current.description}</p>}
        </div> : <p id="now-title" className="text-sm text-slate-500">{milestones.length ? 'Completamos todas las etapas del proyecto.' : 'Estamos preparando el plan del proyecto.'}</p>}
        {upcoming.length > 0 && <><h3 className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wider text-slate-500">Lo que sigue</h3>
          <ul className="grid gap-2 text-sm">{upcoming.map((m) => <li key={m.id} className="flex items-baseline justify-between gap-3 text-slate-700"><span className="truncate">{m.title}</span>{m.dueDate && <span className="shrink-0 text-xs text-slate-500">{short(m.dueDate)}</span>}</li>)}</ul></>}
      </section>

      <div className="grid gap-5 sm:grid-cols-2">
        <section className={card} aria-label="Próximo pago">
          <CardHead title="Próximo pago" href={`${base}?tab=pagos`} label="Ver pagos" />
          {nextPayment && label ? <><p className="truncate text-sm font-semibold text-slate-900">{nextPayment.concept}</p><p className="mt-1 text-sm text-slate-500">{formatMoney(nextPayment.amount, nextPayment.currency)} · <span className={`font-semibold ${label.tone}`}>{label.text}</span></p></>
            : <p className="text-sm text-slate-500">{payments.length ? 'Estás al día con tus pagos.' : 'Este proyecto no tiene pagos programados.'}</p>}
        </section>
        <section className={card} aria-label="Últimas etapas aprobadas">
          <CardHead title="Aprobado" />
          {approved.length ? <ul className="grid gap-2">{approved.map((m) => <li key={m.id}><Link href={`${base}?tab=avance#hito-${m.id}`} className="flex items-center gap-2 text-sm text-slate-800 hover:text-slate-950"><Check size={15} className="shrink-0 text-emerald-500" /><span className="min-w-0 flex-1 truncate">{m.title}</span><span className="text-xs text-slate-500">{short(m.approvedAt || m.completedAt)}</span></Link></li>)}</ul>
            : <p className="text-sm text-slate-500">Cuando apruebes la primera etapa, la verás aquí.</p>}
        </section>
      </div>
    </div>
    <ProjectSiteCard projectId={project.id} site={project.site} launchDate={project.estimatedEndDate} />
  </div>;
}

function DeliverableRow({ d, done }: { d: Deliverable; done: boolean }) {
  const when = d.completedAt ? `${done ? 'Entregado' : 'Subido'} el ${short(d.completedAt)}` : d.dueDate ? `Previsto ${short(d.dueDate)}` : '';
  return <li className="text-sm"><div className="flex items-baseline justify-between gap-3"><p className="font-medium text-slate-900">{d.title}</p>{when && <span className="shrink-0 text-xs text-slate-500">{when}</span>}</div>
    {d.description && <p className="mt-0.5 text-xs leading-5 text-slate-500">{d.description}</p>}
    <div className="mt-1.5"><DeliverableAttachmentList attachments={attachmentsOf(d)} /></div></li>;
}

function MilestoneItem({ m, current, deliverables, payments, projectId }: { m: ClientMilestone; current: boolean; deliverables: Deliverable[]; payments: ClientPayment[]; projectId: string }) {
  const done = isMilestoneDone(m.status);
  const review = m.status === 'IN_REVIEW';
  const dot = done ? 'border-brand bg-brand' : review ? 'border-amber-400 shadow-[0_0_0_5px_rgb(251_191_36/0.14)]' : current ? 'border-brand shadow-[0_0_0_5px_rgb(238_77_49/0.15)]' : 'border-slate-400';
  const date = done ? `Aprobado ${formatDate(m.approvedAt || m.completedAt)}` : m.dueDate ? `Previsto ${formatDate(m.dueDate)}` : '';
  return <li id={`hito-${m.id}`} className="relative scroll-mt-24 rounded-xl py-1 target:bg-slate-50 target:px-3 target:py-3">
    <span aria-hidden="true" className={`absolute -left-[31px] top-2 size-[18px] rounded-full border-2 bg-background ${dot}`} />
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
      <p className={`text-sm font-semibold ${done ? 'text-slate-500' : 'text-slate-950'}`}>{m.title}</p>
      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${review ? 'bg-amber-400 text-black' : done ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-100 text-slate-600'}`}>{review ? 'Por revisar' : done ? 'Aprobado' : milestoneStatus[m.status] || m.status}</span>
      {date && <span className="text-xs text-slate-500">{date}</span>}
    </div>
    {m.description && <p className="mt-1 text-xs leading-5 text-slate-500">{m.description}</p>}
    {deliverables.length > 0 && <ul className={`mt-3 space-y-3 rounded-xl border p-3 ${review ? 'border-amber-500/30 bg-amber-500/5' : 'border-slate-200 bg-slate-50'}`}>{deliverables.map((d) => <DeliverableRow key={d.id} d={d} done={done} />)}</ul>}
    {review && <ClientMilestoneDecision projectId={projectId} milestoneId={m.id} title={m.title} linkedPayments={payments.filter((p) => p.milestoneId === m.id && p.status === 'SCHEDULED').length} />}
  </li>;
}

/** El cronograma solo aporta con fechas reales: fases programadas o ≥2 hitos con fecha. */
const hasTimeline = (project: ClientProject) => (project.sprints ?? []).some((s) => s.startDate && s.endDate) || project.milestones.filter((m) => m.dueDate || m.completedAt).length >= 2;

/** Avance: hitos con sus entregables en una sola lista. */
export function ProgressView({ project, payments }: { project: ClientProject; payments: ClientPayment[] }) {
  const { milestones } = project;
  const deliverables = project.deliverables ?? [];
  const currentId = milestones.find((m) => !isMilestoneDone(m.status))?.id;
  const loose = deliverables.filter((d) => !d.milestone || !milestones.some((m) => m.id === d.milestone!.id));
  return <div className="space-y-5">
    <section className={card} aria-labelledby="ms-title">
      <h2 id="ms-title" className={`${h2} mb-5`}>Hitos y entregables</h2>
      {milestones.length ? <ol className="ml-[9px] space-y-7 border-l-2 border-slate-200 pl-6">{milestones.map((m) => <MilestoneItem key={m.id} m={m} current={m.id === currentId} deliverables={deliverables.filter((d) => d.milestone?.id === m.id)} payments={payments} projectId={project.id} />)}</ol>
        : <p className="text-sm text-slate-500">Todavía no hay hitos visibles.</p>}
    </section>
    {loose.length > 0 && <section className={card} aria-labelledby="loose-title"><h2 id="loose-title" className={`${h2} mb-4`}>Otros entregables</h2><ul className="space-y-4">{loose.map((d) => <DeliverableRow key={d.id} d={d} done={Boolean(d.completedAt)} />)}</ul></section>}
    {hasTimeline(project) && <section className={card} aria-labelledby="timeline-title"><h2 id="timeline-title" className={`${h2} mb-5`}>Cronograma</h2>
      <ClientProjectTimeline startDate={project.startDate} endDate={project.estimatedEndDate} phases={project.sprints ?? []} milestones={milestones} /></section>}
  </div>;
}

export function ScopeView({ project }: { project: ClientProject }) {
  return <section className={card} aria-labelledby="scope-title"><h2 id="scope-title" className={`${h2} mb-5`}>Lo que acordamos</h2><ScopeColumns scope={project.scope} assumptionsLabel="Condiciones" /></section>;
}

/** Pagos del proyecto (texto condicional, sin «Sin fecha») y archivos compartidos. */
export function MoneyDocsView({ project, payments, documents }: { project: ClientProject; payments: ClientPayment[]; documents: Doc[] }) {
  return <div className="grid gap-5 lg:grid-cols-2">
    <section className={card} aria-labelledby="pay-title">
      <div className="mb-2 flex items-baseline justify-between gap-2"><h2 id="pay-title" className={h2}>Pagos</h2><Link href={ROUTES.client.payments} className="text-xs font-semibold text-slate-600 hover:text-slate-950">Gestionar pagos</Link></div>
      {payments.length ? <ul className="divide-y divide-slate-200">{payments.map((p) => { const label = paymentLabel(p, project.milestones);
        return <li key={p.id} className="flex items-center gap-3 py-3"><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-slate-900">{p.concept}</p><p className={`text-xs ${label.tone}`}>{p.status === 'PAID' && p.paidAt ? `Pagado ${formatDate(p.paidAt)}` : label.text}</p></div>
          <div className="text-right"><p className="text-sm font-semibold text-slate-950">{formatMoney(p.amount, p.currency)}</p><span className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${paymentStatusStyles[p.status] || ''}`}>{paymentStatus[p.status] || p.status}</span></div></li>; })}</ul>
        : <p className="mt-3 text-sm text-slate-500">Este proyecto no tiene pagos programados.</p>}
    </section>
    <section className={card} aria-labelledby="docs-title">
      <div className="mb-2 flex items-baseline justify-between gap-2"><h2 id="docs-title" className={h2}>Documentos</h2><Link href={ROUTES.client.documents} className="text-xs font-semibold text-slate-600 hover:text-slate-950">Ver todos</Link></div>
      {documents.length ? <ul className="divide-y divide-slate-200">{documents.slice(0, 8).map((doc) => <li key={doc.id} className="flex items-center gap-3 py-3"><FileText className="shrink-0 text-slate-400" size={18} /><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-slate-900">{doc.originalName}</p><p className="text-xs text-slate-500">{documentType[doc.type] || doc.type} · {formatDate(doc.createdAt)}</p></div>
        <a href={`/api/backend/documents/${doc.id}/download`} className="inline-flex size-10 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-950" aria-label={`Descargar ${doc.originalName}`}><Download size={17} /></a></li>)}</ul>
        : <p className="mt-3 text-sm text-slate-500">No hay documentos compartidos para este proyecto.</p>}
    </section>
  </div>;
}
