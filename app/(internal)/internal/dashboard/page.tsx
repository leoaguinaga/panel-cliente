import Link from 'next/link';
import { ArrowRight, CalendarCheck } from 'lucide-react';
import { requireAuth } from '@/src/lib/auth';
import { ROLES } from '@/src/modules/auth/server/permissions';
import { getTodayAgenda } from '@/src/modules/dashboard/server/queries';
import { getClients } from '@/src/modules/leads/server/queries';
import { getCatalogs } from '@/src/modules/products/server/queries';
import { getActiveWorkspace } from '@/src/modules/workspaces/server/workspace';
import { AgendaExtraRow, AgendaGroup } from '@/components/internal/today/AgendaList';
import { NewMenu } from '@/components/internal/today/NewMenu';
import { WeekStrip } from '@/components/internal/today/WeekStrip';
import { formatLongDay, formatWeekday, kindLabels } from '@/components/internal/today/today-items';

function greeting(now = new Date()) {
  const hour = (now.getUTCHours() + 24 - 5) % 24; // America/Lima
  return hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';
}

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

export default async function TodayPage() {
  const session = await requireAuth([ROLES.ADMIN, ROLES.WORKER]);
  const isAdmin = session.user.role === ROLES.ADMIN;
  const [agenda, clients, catalogs, workspace] = await Promise.all([getTodayAgenda(), isAdmin ? getClients() : Promise.resolve([]), isAdmin ? getCatalogs().catch(() => null) : Promise.resolve(null), getActiveWorkspace()]);
  const firstName = session.user.name?.split(' ')[0] ?? '';
  const dueNow = agenda.overdue.length + agenda.today.length;
  const decisionCount = agenda.decisions.length + (agenda.unassignedTasks > 0 ? 1 : 0);
  const nextUp = agenda.week[0];

  return (
    <div className="mx-auto max-w-5xl space-y-9">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-3xl font-semibold tracking-tight text-balance">{greeting()}{firstName ? `, ${firstName}` : ''}</h1>
          <p className="mt-1.5 text-[15px] text-muted-foreground">
            <span className="text-foreground">{formatLongDay(agenda.date)}</span>
            {' · '}
            {dueNow === 0 ? 'No tienes nada pendiente para hoy' : <>Tienes <b className="font-semibold text-foreground">{plural(dueNow, 'pendiente', 'pendientes')}</b>{agenda.overdue.length > 0 && <>, {agenda.overdue.length === 1 ? '1 atrasado' : `${agenda.overdue.length} atrasados`}</>}</>}
            {isAdmin && decisionCount > 0 && <>. Además, <b className="font-semibold text-foreground">{plural(decisionCount, 'caso espera', 'casos esperan')}</b> tu decisión</>}.
          </p>
        </div>
        {isAdmin && <NewMenu workers={agenda.workers} clients={clients} products={catalogs?.products ?? []} defaultProductId={catalogs?.products.some((product) => product.id === workspace) ? workspace : null} />}
      </header>

      {dueNow === 0 ? (
        <div className="flex flex-col items-center gap-1.5 rounded-xl border border-dashed px-6 py-10 text-center">
          <CalendarCheck aria-hidden className="mb-1 size-6 text-muted-foreground" />
          <p className="font-heading text-lg font-semibold">Nada pendiente para hoy</p>
          <p className="text-sm text-muted-foreground">
            {nextUp ? <>Lo próximo: <Link href="#week-title" className="font-medium text-foreground underline underline-offset-4">{kindLabels[nextUp.kind].toLowerCase()} · {nextUp.title}</Link>, el {formatWeekday(nextUp.date!)} {Number(nextUp.date!.slice(8))}.</> : 'Tampoco hay compromisos con fecha en los próximos 7 días.'}
          </p>
        </div>
      ) : (
        <div id="hoy" className="scroll-mt-24 space-y-7">
          <AgendaGroup title="Atrasado" tone="late" items={agenda.overdue} today={agenda.date} />
          <AgendaGroup title="Hoy" items={agenda.today} today={agenda.date} />
        </div>
      )}

      {isAdmin && (
        <AgendaGroup title="Requiere tu decisión" note="solo administradores" items={agenda.decisions} today={agenda.date}>
          {agenda.unassignedTasks > 0 && (
            <AgendaExtraRow
              href="/internal/tasks?workerId=unassigned"
              label={plural(agenda.unassignedTasks, 'tarea abierta', 'tareas abiertas')}
              description="En proyectos activos y sin nadie asignado"
              action="Repartir tareas"
            />
          )}
        </AgendaGroup>
      )}

      <WeekStrip today={agenda.date} todayCount={dueNow} items={agenda.week} />

      <footer className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t pt-4 text-[13px] text-muted-foreground">
        <span className="tabular-nums">
          {plural(agenda.summary.activeProjects, 'proyecto activo', 'proyectos activos')} · {plural(agenda.summary.pausedProjects, 'pausado', 'pausados')} · {plural(agenda.summary.openTeamTasks, 'tarea abierta', 'tareas abiertas')} en el equipo
        </span>
        <Link href="/internal/dashboard/gestion" className="inline-flex items-center gap-1 font-medium text-foreground underline-offset-4 hover:underline">
          Ver resumen de gestión <ArrowRight aria-hidden className="size-3.5" />
        </Link>
      </footer>
    </div>
  );
}
