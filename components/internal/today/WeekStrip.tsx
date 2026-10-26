import Link from 'next/link';
import type { TodayItem } from '@/src/modules/dashboard/server/queries';
import { addDays, formatMoney, formatMonth, formatWeekday, isWeekend, itemHref, kindDot, kindLabels } from './today-items';

const PER_DAY = 3;
const legend = [
  { label: 'Tareas', dot: kindDot.task },
  { label: 'Leads', dot: kindDot.lead },
  { label: 'Reuniones', dot: kindDot.meeting },
  { label: 'Demos', dot: kindDot.demo },
  { label: 'Entregas', dot: kindDot.deliverable },
  { label: 'Hitos en revisión', dot: kindDot.milestone_review },
  { label: 'Cobros', dot: kindDot.payment_due },
];

/**
 * Calendario de los próximos 7 días. Empieza en hoy para dar continuidad con la
 * lista de arriba (hoy solo muestra el conteo); el resto lista lo que tiene fecha.
 */
export function WeekStrip({ today, todayCount, items }: { today: string; todayCount: number; items: TodayItem[] }) {
  const days = Array.from({ length: 7 }, (_, index) => addDays(today, index));
  const byDay = new Map<string, TodayItem[]>(days.map((day) => [day, []]));
  for (const item of items) if (item.date) byDay.get(item.date)?.push(item);
  const total = items.length;

  return (
    <section aria-labelledby="week-title" className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div>
          <h2 id="week-title" className="text-lg font-semibold">Próximos 7 días</h2>
          <p className="text-sm text-muted-foreground">
            {total === 0 ? 'Sin compromisos con fecha esta semana.' : `${total} ${total === 1 ? 'compromiso' : 'compromisos'} con fecha hasta el ${formatWeekday(days[6])} ${Number(days[6].slice(8))}.`}
          </p>
        </div>
        <ul aria-label="Leyenda" className="flex flex-wrap gap-x-3.5 gap-y-1 text-xs text-muted-foreground">
          {legend.map((entry) => <li key={entry.label} className="flex items-center gap-1.5"><span aria-hidden className={`size-2 rounded-full ${entry.dot}`} />{entry.label}</li>)}
        </ul>
      </div>

      <ol className="grid overflow-hidden rounded-xl border bg-card md:grid-cols-7">
        {days.map((day, index) => {
          const isToday = index === 0;
          const dayItems = isToday ? [] : byDay.get(day) ?? [];
          const weekend = isWeekend(day);
          const showMonth = index === 0 || day.slice(8) === '01';
          return (
            <li
              key={day}
              aria-label={`${formatWeekday(day)} ${Number(day.slice(8))}${isToday ? ', hoy' : ''}: ${isToday ? `${todayCount} para hoy` : `${dayItems.length} compromisos`}`}
              className={`grid grid-cols-[3.25rem_minmax(0,1fr)] gap-3 border-t px-3 py-3 first:border-t-0 md:flex md:min-h-44 md:flex-col md:gap-2.5 md:border-t-0 md:border-l md:first:border-l-0 ${weekend ? 'bg-muted/35' : ''} ${isToday ? 'bg-foreground/[0.025]' : ''}`}
            >
              <div className="flex flex-col items-start md:flex-row md:items-baseline md:justify-between">
                <span className={`text-xs font-medium capitalize ${isToday ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {isToday ? 'Hoy' : formatWeekday(day)}
                </span>
                <span className="flex items-baseline gap-1">
                  {showMonth && <span className="hidden text-[11px] text-muted-foreground md:inline">{formatMonth(day)}</span>}
                  <span
                    className={`font-heading text-2xl leading-none font-semibold tabular-nums ${isToday ? 'inline-flex size-8 items-center justify-center rounded-full bg-primary text-[17px] text-primary-foreground md:size-9' : weekend ? 'text-muted-foreground' : ''}`}
                  >
                    {Number(day.slice(8))}
                  </span>
                </span>
              </div>

              <div className="min-w-0 space-y-1.5 self-center md:self-auto">
                {isToday && todayCount === 0 ? (
                  <p className="px-2 py-1.5 text-[13px] text-muted-foreground">Nada para hoy</p>
                ) : isToday ? (
                  <a href="#hoy" className="block rounded-lg px-2 py-1.5 text-[13px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <span className="font-semibold text-foreground tabular-nums">{todayCount}</span> {todayCount === 1 ? 'pendiente' : 'pendientes'} arriba
                  </a>
                ) : dayItems.length === 0 ? (
                  <p className="px-2 py-1.5 text-[13px] text-muted-foreground">{weekend ? '—' : 'Libre'}</p>
                ) : (
                  <>
                    {dayItems.slice(0, PER_DAY).map((item) => <WeekEvent key={item.id} item={item} />)}
                    {dayItems.length > PER_DAY && (
                      <details className="group">
                        <summary className="cursor-pointer list-none rounded-md px-2 py-1 text-xs font-medium text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
                          <span className="group-open:hidden">+{dayItems.length - PER_DAY} más</span><span className="hidden group-open:inline">Mostrar menos</span>
                        </summary>
                        <div className="mt-1.5 space-y-1.5">{dayItems.slice(PER_DAY).map((item) => <WeekEvent key={item.id} item={item} />)}</div>
                      </details>
                    )}
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function WeekEvent({ item }: { item: TodayItem }) {
  const money = formatMoney(item.amount);
  return (
    <Link
      href={itemHref(item)}
      className="group/event block rounded-lg border border-transparent bg-background px-2 py-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.05)] ring-1 ring-border/70 transition hover:ring-foreground/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
        <span aria-hidden className={`size-1.5 shrink-0 rounded-full ${kindDot[item.kind]}`} />
        {kindLabels[item.kind]}{item.time ? ` · ${item.time}` : ''}
        {money && <span className="ml-auto tabular-nums text-foreground/80">{money}</span>}
      </span>
      <span className="mt-0.5 line-clamp-2 text-[13px] leading-snug font-medium">{item.title}</span>
      {item.context && <span className="mt-0.5 block truncate text-[11.5px] text-muted-foreground">{item.context}</span>}
    </Link>
  );
}
