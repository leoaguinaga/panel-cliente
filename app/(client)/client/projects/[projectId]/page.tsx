import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, CheckCircle2, CircleDashed, Download, FileText, PackageCheck } from 'lucide-react';
import { ClientProjectTimeline } from '@/components/client/ClientProjectTimeline';
import { documentType, formatDate, formatMoney, milestoneStatus, paymentStatus, paymentStatusStyles, projectStatus } from '@/components/client/client-formatters';
import { getClientDashboard } from '@/src/modules/dashboard/server/queries';
import { ROUTES } from '@/lib/constants';

const DAY = 86_400_000;
const card = 'rounded-2xl border border-slate-200 bg-white p-5 sm:p-6';
const eyebrow = 'text-xs font-semibold uppercase tracking-wider text-slate-400';

function remaining(endDate: string | null, status: string) {
  if (!endDate || status === 'DELIVERED' || status === 'CANCELLED') return null;
  const days = Math.ceil((new Date(endDate).getTime() - Date.now()) / DAY);
  if (days > 1) return `Faltan ${days} días`;
  if (days === 1) return 'Falta 1 día';
  if (days === 0) return 'Entrega prevista hoy';
  return `Fecha estimada superada hace ${-days} día${days === -1 ? '' : 's'}`;
}

export default async function ClientProjectDetail({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const data = await getClientDashboard();
  const project = data.projects.find((item) => item.id === projectId);
  if (!project) notFound();

  const milestones = project.milestones;
  const deliverables = project.deliverables ?? [];
  const documents = data.documents.filter((doc) => doc.projectId === project.id);
  const payments = data.payments.filter((payment) => payment.projectId === project.id);
  const next = milestones.find((m) => m.status !== 'COMPLETED');
  const completed = milestones.filter((m) => m.status === 'COMPLETED').length;
  const countdown = remaining(project.estimatedEndDate, project.status);

  return <div className="space-y-6">
    <Link href={ROUTES.client.projects} className="inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-950"><ArrowLeft size={16} />Mis proyectos</Link>

    <section className="rounded-2xl bg-slate-950 p-6 text-white sm:p-8">
      <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
        <div className="min-w-0">
          <span className="inline-flex rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-slate-200">{projectStatus[project.status] || project.status}</span>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">{project.name}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">{project.description || 'Seguimiento del proyecto, sus fases e hitos.'}</p>
        </div>
        <div className="w-full lg:w-72">
          <div className="mb-2 flex justify-between text-sm"><span className="text-slate-300">Avance</span><strong>{project.progress}%</strong></div>
          <div className="h-2 rounded-full bg-white/15" role="progressbar" aria-valuenow={project.progress} aria-valuemin={0} aria-valuemax={100} aria-label="Avance del proyecto"><div className="h-full rounded-full bg-orange-400" style={{ width: `${project.progress}%` }} /></div>
          {countdown && <p className="mt-3 text-xs text-slate-400">{countdown}</p>}
        </div>
      </div>
      <dl className="mt-8 grid grid-cols-2 gap-4 border-t border-white/10 pt-6 text-sm sm:grid-cols-4">
        <div><dt className="text-slate-400">Inicio</dt><dd className="mt-1 font-medium">{formatDate(project.startDate)}</dd></div>
        <div><dt className="text-slate-400">Entrega estimada</dt><dd className="mt-1 font-medium">{formatDate(project.estimatedEndDate)}</dd></div>
        <div><dt className="text-slate-400">Hitos</dt><dd className="mt-1 font-medium">{completed} de {milestones.length}</dd></div>
        <div><dt className="text-slate-400">Siguiente hito</dt><dd className="mt-1 truncate font-medium">{next?.title || (milestones.length ? 'Todos completados' : 'Por definir')}</dd></div>
      </dl>
    </section>

    <section className={card} aria-labelledby="timeline-title">
      <p className={eyebrow}>Cronograma</p>
      <h2 id="timeline-title" className="mb-5 mt-1 text-lg font-semibold text-slate-950">Fases del proyecto</h2>
      <ClientProjectTimeline startDate={project.startDate} endDate={project.estimatedEndDate} phases={project.sprints ?? []} milestones={milestones} />
    </section>

    <div className="grid gap-6 lg:grid-cols-2">
      <section className={card} aria-labelledby="milestones-title">
        <p className={eyebrow}>Hitos</p>
        <h2 id="milestones-title" className="mt-1 text-lg font-semibold text-slate-950">Lo que vamos cumpliendo</h2>
        {milestones.length ? <ol className="mt-5 space-y-4">{milestones.map((m) => { const done = m.status === 'COMPLETED'; return <li key={m.id} className="flex gap-3">
          {done ? <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-500" size={20} /> : <CircleDashed className={`mt-0.5 shrink-0 ${m.id === next?.id ? 'text-orange-500' : 'text-slate-300'}`} size={20} />}
          <div className="min-w-0"><p className={`text-sm font-medium ${done ? 'text-slate-500' : 'text-slate-900'}`}>{m.title}</p>
            {m.description && <p className="mt-0.5 text-xs leading-5 text-slate-500">{m.description}</p>}
            <p className="mt-1 text-xs text-slate-500">{done ? `Completado ${formatDate(m.completedAt)}` : `${milestoneStatus[m.status] || m.status}${m.dueDate ? ` · previsto ${formatDate(m.dueDate)}` : ''}`}</p></div>
        </li>; })}</ol> : <p className="mt-5 text-sm text-slate-600">Todavía no hay hitos visibles.</p>}
      </section>

      <section className={card} aria-labelledby="deliverables-title">
        <p className={eyebrow}>Entregables</p>
        <h2 id="deliverables-title" className="mt-1 text-lg font-semibold text-slate-950">Qué vas a recibir</h2>
        {deliverables.length ? <ul className="mt-5 space-y-3">{deliverables.map((d) => <li key={d.id} className="flex gap-3 rounded-xl border border-slate-100 p-3">
          <PackageCheck className={`mt-0.5 shrink-0 ${d.completedAt ? 'text-emerald-500' : 'text-slate-400'}`} size={18} />
          <div className="min-w-0"><p className="text-sm font-medium text-slate-900">{d.title}</p>{d.description && <p className="mt-0.5 text-xs leading-5 text-slate-500">{d.description}</p>}
            <p className="mt-1 text-xs text-slate-500">{d.completedAt ? `Entregado ${formatDate(d.completedAt)}` : d.dueDate ? `Previsto ${formatDate(d.dueDate)}` : 'Fecha por definir'}</p></div>
        </li>)}</ul> : <p className="mt-5 text-sm text-slate-600">El equipo publicará aquí los entregables acordados.</p>}
      </section>
    </div>

    <div className="grid gap-6 lg:grid-cols-2">
      <section className={card} aria-labelledby="project-docs-title">
        <div className="flex items-baseline justify-between gap-2"><h2 id="project-docs-title" className="text-lg font-semibold text-slate-950">Documentos</h2><Link href={ROUTES.client.documents} className="text-sm font-medium text-slate-600 hover:text-slate-950">Ver todos</Link></div>
        {documents.length ? <ul className="mt-4 divide-y divide-slate-100">{documents.slice(0, 5).map((doc) => <li key={doc.id} className="flex items-center gap-3 py-3">
          <FileText className="shrink-0 text-slate-400" size={18} /><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-slate-900">{doc.originalName}</p><p className="text-xs text-slate-500">{documentType[doc.type] || doc.type} · {formatDate(doc.createdAt)}</p></div>
          <a href={`/api/backend/documents/${doc.id}/download`} className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-950" aria-label={`Descargar ${doc.originalName}`}><Download size={17} /></a>
        </li>)}</ul> : <p className="mt-4 text-sm text-slate-600">No hay documentos compartidos para este proyecto.</p>}
      </section>

      <section className={card} aria-labelledby="project-payments-title">
        <div className="flex items-baseline justify-between gap-2"><h2 id="project-payments-title" className="text-lg font-semibold text-slate-950">Pagos</h2><Link href={ROUTES.client.payments} className="text-sm font-medium text-slate-600 hover:text-slate-950">Gestionar pagos</Link></div>
        {payments.length ? <ul className="mt-4 divide-y divide-slate-100">{payments.map((p) => <li key={p.id} className="flex items-center gap-3 py-3">
          <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-slate-900">{p.concept}</p><p className="text-xs text-slate-500">{p.status === 'PAID' ? `Pagado ${formatDate(p.paidAt)}` : `Vence ${formatDate(p.dueDate)}`}</p></div>
          <div className="text-right"><p className="text-sm font-semibold text-slate-950">{formatMoney(p.amount, p.currency)}</p><span className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${paymentStatusStyles[p.status] || ''}`}>{paymentStatus[p.status] || p.status}</span></div>
        </li>)}</ul> : <p className="mt-4 text-sm text-slate-600">Este proyecto no tiene pagos programados.</p>}
      </section>
    </div>
  </div>;
}
