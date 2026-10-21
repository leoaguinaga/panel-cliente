import Link from 'next/link';
import { CalendarClock, FolderKanban } from 'lucide-react';
import { getClientDashboard } from '@/src/modules/dashboard/server/queries';
import { ROUTES } from '@/lib/constants';
import { DeliveredRow, ProjectCard, projectAttention } from '@/components/client/ProjectCard';

const meetingDay = (date: string) => new Intl.DateTimeFormat('es-PE', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(`${date}T00:00:00Z`));
const chip = 'inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[13px] text-slate-700 [&_b]:font-semibold [&_b]:text-slate-950';

function Section({ title, count, children }: { title: string; count?: number; children: React.ReactNode }) {
  return <section aria-label={title} className="space-y-3">
    <h2 className="flex items-center gap-3 text-xs font-semibold uppercase tracking-wider text-slate-500">{title}{count ? ` · ${count}` : ''}<span aria-hidden="true" className="h-px flex-1 bg-slate-200" /></h2>
    {children}
  </section>;
}

export default async function ClientProjectsPage() {
  const data = await getClientDashboard();
  const projects = data.projects.filter((p) => p.status !== 'CANCELLED');

  if (projects.length === 0) return <div className="space-y-8">
    <header><h1 className="text-5xl text-slate-950 sm:text-6xl">Mis proyectos</h1><p className="mt-2 text-sm text-slate-500">Lo que construimos contigo, en un vistazo.</p></header>
    <div className="rounded-2xl border border-dashed border-slate-300 bg-card p-10 text-center"><FolderKanban className="mx-auto mb-4 text-slate-400" /><h2 className="font-semibold text-slate-950">Tu primer proyecto aparecerá aquí</h2><p className="mt-2 text-sm text-slate-500">Cuando iniciemos uno, verás su avance, su vista previa y lo que necesitamos de ti. ¿Dudas? <Link href={ROUTES.client.help} className="font-semibold text-slate-800 underline underline-offset-2 hover:text-slate-950">Visita Ayuda</Link>.</p></div>
  </div>;

  const paymentsOf = (id: string) => data.payments.filter((p) => p.projectId === id && p.status !== 'CANCELLED');
  const byRecent = (a: { updatedAt: string }, b: { updatedAt: string }) => b.updatedAt.localeCompare(a.updatedAt);
  const open = projects.filter((p) => p.status !== 'DELIVERED').sort(byRecent);
  const attention = open.filter((p) => projectAttention(p, paymentsOf(p.id)).needsAttention);
  const running = open.filter((p) => !attention.includes(p));
  const delivered = projects.filter((p) => p.status === 'DELIVERED').sort(byRecent);
  const reviewTotal = open.reduce((n, p) => n + p.milestones.filter((m) => m.status === 'IN_REVIEW').length, 0);
  const ids = new Set(projects.map((p) => p.id));
  const meeting = data.meetings.filter((m) => m.projectId && ids.has(m.projectId)).sort((a, b) => a.date.localeCompare(b.date))[0];
  const cards = (list: typeof open) => <div className="space-y-4">{list.map((p) => <ProjectCard key={p.id} project={p} payments={paymentsOf(p.id)} />)}</div>;
  const single = projects.length === 1;
  const deliveredList = <ul className="space-y-2.5">{delivered.map((p) => <DeliveredRow key={p.id} project={p} />)}</ul>;

  return <div className="space-y-6">
    <header>
      <h1 className="text-5xl text-slate-950 sm:text-6xl">Mis proyectos</h1>
      <p className="mt-2 text-sm text-slate-500">Lo que construimos contigo, en un vistazo.</p>
      <div className="mt-5 flex flex-wrap gap-2">
        <span className={chip}><b>{projects.length}</b> {projects.length === 1 ? 'proyecto' : 'proyectos'}</span>
        {open.length > 0 && <span className={chip}><b>{open.length}</b> en marcha</span>}
        {reviewTotal > 0 && <span className={`${chip} !border-amber-500/40 !bg-amber-500/10 !text-amber-400 [&_b]:!text-amber-300`}><b>{reviewTotal}</b> {reviewTotal === 1 ? 'espera' : 'esperan'} tu revisión</span>}
        {meeting && <span className={chip}><CalendarClock size={14} aria-hidden="true" />Próxima reunión · <b className="capitalize">{meetingDay(meeting.date)}{meeting.time && `, ${meeting.time}`}</b></span>}
      </div>
    </header>

    {single && open.length === 1 && cards(open)}
    {single && delivered.length === 1 && deliveredList}
    {!single && <>
      {attention.length > 0 && <Section title="Requiere tu atención">{cards(attention)}</Section>}
      {running.length > 0 && <Section title="En marcha">{cards(running)}</Section>}
      {delivered.length > 0 && <Section title="Entregados" count={delivered.length}>
        {delivered.length >= 3
          ? <details className="group/d"><summary className="flex min-h-10 cursor-pointer list-none items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-950 [&::-webkit-details-marker]:hidden"><span className="group-open/d:hidden">Mostrar entregados</span><span className="hidden group-open/d:inline">Ocultar entregados</span></summary><div className="mt-3">{deliveredList}</div></details>
          : deliveredList}
      </Section>}
    </>}
  </div>;
}
