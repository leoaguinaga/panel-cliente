'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, CircleDollarSign, PackageCheck, Video } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/lib/constants';
import { formatMoney, paymentStatus } from '@/components/client/client-formatters';
import type { ClientDashboard } from '@/src/modules/dashboard/server/queries';

type Kind = 'meeting' | 'delivery' | 'payment';
type CalendarItem = {
  id: string; kind: Kind; day: string; title: string; context: string; detail: string | null;
  done: boolean; late: boolean; href: string | null; external: boolean;
};

const kindMeta: Record<Kind, { label: string; Icon: typeof Video; dot: string; chip: string }> = {
  meeting: { label: 'Reunión', Icon: Video, dot: 'bg-sky-400', chip: 'border-sky-400/30 bg-sky-400/10 text-sky-300' },
  delivery: { label: 'Entrega', Icon: PackageCheck, dot: 'bg-orange-500', chip: 'border-orange-500/30 bg-orange-500/10 text-orange-300' },
  payment: { label: 'Pago', Icon: CircleDollarSign, dot: 'bg-emerald-400', chip: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300' },
};

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const pad = (n: number) => String(n).padStart(2, '0');
const key = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;
const limaToday = () => new Date(Date.now() - 5 * 3600 * 1000).toISOString().slice(0, 10);
const fullDay = (day: string) =>
  new Intl.DateTimeFormat('es-PE', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(`${day}T00:00:00Z`));
const monthLabel = (y: number, m: number) =>
  new Intl.DateTimeFormat('es-PE', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(y, m, 1)));
const clock = (time: string | null) => (time ? time : 'Hora por confirmar');

function buildItems(data: ClientDashboard): CalendarItem[] {
  const items: CalendarItem[] = [];
  const projectName = new Map(data.projects.map((p) => [p.id, p.name]));

  for (const m of data.meetings) {
    items.push({
      id: `m:${m.id}`, kind: 'meeting', day: m.date, title: m.title,
      context: `${m.projectId ? projectName.get(m.projectId) ?? 'Proyecto' : 'FoxCode'}`,
      detail: `${clock(m.time)} · ${m.duration} min`, done: false, late: false,
      href: m.meetUrl, external: true,
    });
  }
  for (const p of data.projects) {
    for (const d of p.deliverables ?? []) {
      if (!d.dueDate) continue;
      items.push({
        id: `d:${d.id}`, kind: 'delivery', day: d.dueDate.slice(0, 10), title: d.title,
        context: p.name, detail: d.milestone?.title ?? null,
        done: Boolean(d.done || d.completedAt), late: false,
        href: `${ROUTES.client.projects}/${p.id}`, external: false,
      });
    }
  }
  for (const pay of data.payments) {
    if (!pay.dueDate || pay.status === 'CANCELLED') continue;
    items.push({
      id: `p:${pay.id}`, kind: 'payment', day: pay.dueDate.slice(0, 10), title: pay.concept,
      context: pay.project?.name ?? 'FoxCode',
      detail: `${formatMoney(pay.amount, pay.currency)} · ${paymentStatus[pay.status] ?? pay.status}`,
      done: pay.status === 'PAID', late: pay.status === 'OVERDUE',
      href: ROUTES.client.payments, external: false,
    });
  }
  return items.sort((a, b) => a.day.localeCompare(b.day));
}

function ItemRow({ item }: { item: CalendarItem }) {
  const { Icon, chip, label } = kindMeta[item.kind];
  const body = (
    <>
      <span className={cn('mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border', chip)}><Icon size={15} aria-hidden="true" /></span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-x-2 text-[11px] font-medium uppercase tracking-wide text-slate-500">
          {label}
          {item.done && <span className="text-emerald-400">{item.kind === 'payment' ? 'Pagado' : 'Completada'}</span>}
          {item.late && <span className="text-red-400">Vencido</span>}
        </span>
        <span className={cn('block truncate text-sm font-medium text-slate-950', item.done && 'text-slate-500 line-through')}>{item.title}</span>
        <span className="block truncate text-xs text-slate-600">{item.context}{item.detail ? ` · ${item.detail}` : ''}</span>
      </span>
    </>
  );
  const cls = 'flex items-start gap-3 rounded-xl p-2.5 transition-colors';
  if (!item.href) return <li className={cls}>{body}</li>;
  return (
    <li>
      {item.external
        ? <a href={item.href} target="_blank" rel="noreferrer" aria-label={`${item.title}: unirse a la reunión`} className={cn(cls, 'hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950')}>{body}</a>
        : <Link href={item.href} className={cn(cls, 'hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950')}>{body}</Link>}
    </li>
  );
}

export function ClientCalendarView({ data }: { data: ClientDashboard }) {
  const today = limaToday();
  const [year, setYear] = useState(Number(today.slice(0, 4)));
  const [month, setMonth] = useState(Number(today.slice(5, 7)) - 1);
  const [selected, setSelected] = useState<string | null>(today);

  const items = useMemo(() => buildItems(data), [data]);
  const byDay = useMemo(() => {
    const map = new Map<string, CalendarItem[]>();
    for (const item of items) map.set(item.day, [...(map.get(item.day) ?? []), item]);
    return map;
  }, [items]);

  const first = new Date(Date.UTC(year, month, 1));
  const lead = (first.getUTCDay() + 6) % 7;
  const total = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const cells = Array.from({ length: Math.ceil((lead + total) / 7) * 7 }, (_, i) => {
    const d = i - lead + 1;
    return d >= 1 && d <= total ? d : null;
  });

  const move = (delta: number) => {
    const next = new Date(Date.UTC(year, month + delta, 1));
    setYear(next.getUTCFullYear());
    setMonth(next.getUTCMonth());
    setSelected(null);
  };
  const goToday = () => {
    setYear(Number(today.slice(0, 4)));
    setMonth(Number(today.slice(5, 7)) - 1);
    setSelected(today);
  };

  const monthPrefix = `${year}-${pad(month + 1)}`;
  const upcoming = items.filter((i) => i.day >= today && !i.done).slice(0, 6);
  const selectedItems = selected ? byDay.get(selected) ?? [] : [];
  const monthItems = items.filter((i) => i.day.startsWith(monthPrefix));

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <section aria-label="Calendario" className="rounded-2xl border border-slate-200 bg-card p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-xl capitalize tracking-wide text-slate-950">{monthLabel(year, month)}</h2>
          <div className="flex items-center gap-1.5">
            <button type="button" onClick={goToday} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950">Hoy</button>
            <button type="button" aria-label="Mes anterior" onClick={() => move(-1)} className="rounded-lg border border-slate-200 p-1.5 text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950"><ChevronLeft size={16} /></button>
            <button type="button" aria-label="Mes siguiente" onClick={() => move(1)} className="rounded-lg border border-slate-200 p-1.5 text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950"><ChevronRight size={16} /></button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium uppercase tracking-wide text-slate-500">
          {WEEKDAYS.map((d) => <div key={d} className="py-1">{d}</div>)}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {cells.map((d, i) => {
            if (!d) return <div key={`e${i}`} aria-hidden="true" />;
            const day = key(year, month, d);
            const dayItems = byDay.get(day) ?? [];
            const kinds = Array.from(new Set(dayItems.map((x) => x.kind)));
            const isToday = day === today;
            const isSelected = day === selected;
            return (
              <button
                key={day} type="button" onClick={() => setSelected(day)} aria-pressed={isSelected}
                aria-label={`${fullDay(day)}${dayItems.length ? `, ${dayItems.length} evento${dayItems.length > 1 ? 's' : ''}` : ''}`}
                className={cn(
                  'flex aspect-square min-h-11 flex-col items-center justify-between rounded-xl border p-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 sm:aspect-[4/3]',
                  isSelected ? 'border-orange-500 bg-orange-500/10' : 'border-transparent hover:border-slate-200 hover:bg-slate-100',
                )}
              >
                <span className={cn('flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium', isToday ? 'bg-orange-500 text-white' : 'text-slate-700')}>{d}</span>
                <span className="flex h-2 items-center gap-1">
                  {kinds.map((k) => <span key={k} className={cn('h-1.5 w-1.5 rounded-full', kindMeta[k].dot)} />)}
                </span>
              </button>
            );
          })}
        </div>

        <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 border-t border-slate-200 pt-3 text-xs text-slate-600" aria-label="Leyenda">
          {(Object.keys(kindMeta) as Kind[]).map((k) => (
            <li key={k} className="flex items-center gap-1.5"><span className={cn('h-2 w-2 rounded-full', kindMeta[k].dot)} />{kindMeta[k].label}{k === 'meeting' ? 'es' : 's'}</li>
          ))}
        </ul>
      </section>

      <aside className="space-y-6">
        <section aria-live="polite" className="rounded-2xl border border-slate-200 bg-card p-4">
          <h2 className="px-1 text-sm font-semibold capitalize text-slate-950">{selected ? fullDay(selected) : 'Selecciona un día'}</h2>
          {selected && selectedItems.length === 0 && <p className="px-1 pt-2 text-sm text-slate-600">Sin eventos este día.</p>}
          {!selected && <p className="px-1 pt-2 text-sm text-slate-600">{monthItems.length ? `${monthItems.length} evento${monthItems.length > 1 ? 's' : ''} este mes.` : 'No hay eventos este mes.'}</p>}
          {selectedItems.length > 0 && <ul className="mt-2 space-y-1">{selectedItems.map((i) => <ItemRow key={i.id} item={i} />)}</ul>}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-card p-4">
          <h2 className="px-1 text-sm font-semibold text-slate-950">Próximos eventos</h2>
          {upcoming.length === 0
            ? <p className="flex items-center gap-2 px-1 pt-2 text-sm text-slate-600"><CalendarDays size={15} aria-hidden="true" />Aún no hay fechas programadas.</p>
            : <ul className="mt-2 space-y-3">
                {upcoming.map((i, idx) => (
                  <li key={i.id}>
                    {(idx === 0 || upcoming[idx - 1].day !== i.day) && <p className="px-1 pb-1 text-[11px] font-medium uppercase tracking-wide text-slate-500">{i.day === today ? 'Hoy' : fullDay(i.day)}</p>}
                    <ul><ItemRow item={i} /></ul>
                  </li>
                ))}
              </ul>}
        </section>
      </aside>
    </div>
  );
}
