'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { Button } from '@/components/ui/button';
import type { AgendaGroupKey, AgendaPayment } from '@/src/modules/payments/server/queries';
import { needsReminder, owedOrPaid, reminderLabel, sortCurrencies, totalsByCurrency, whenLabel } from './agenda-format';
import { PaymentDrawer, tabsFor, type DrawerTab, type ReminderSettings } from './PaymentDrawer';

const GROUPS: { key: AgendaGroupKey; title: string; tone: string; collapsed?: boolean; hint?: string }[] = [
  { key: 'overdue', title: 'Vencido', tone: 'text-rose-700' },
  { key: 'week', title: 'Esta semana', tone: 'text-amber-700' },
  { key: 'next30', title: 'Próximos 30 días', tone: 'text-slate-700' },
  { key: 'noDate', title: 'Sin fecha', tone: 'text-slate-500', hint: 'Exigibles pero sin vencimiento: ponles fecha en el proyecto.' },
  { key: 'later', title: 'Más adelante', tone: 'text-slate-500', collapsed: true },
  { key: 'awaitingMilestone', title: 'Esperando hito', tone: 'text-sky-700', collapsed: true, hint: 'Se vuelven exigibles cuando se aprueba su hito.' },
  { key: 'paid', title: 'Cobrado · últimos 30 días', tone: 'text-emerald-700', collapsed: true },
];

const clientName = (payment: AgendaPayment) => payment.client.businessName || payment.client.name;

export function CollectionsAgenda({ items, today, isAdmin, allPaid, reminder, initialPayment }: { items: AgendaPayment[]; today: string; isAdmin: boolean; allPaid: boolean; reminder: ReminderSettings; initialPayment?: AgendaPayment }) {
  const [currency, setCurrency] = useState<string | null>(null);
  const [onlyToRemind, setOnlyToRemind] = useState(false);
  const [query, setQuery] = useState('');
  // Se guarda la cuota abierta para seguir mostrándola si sale de la agenda tras un cambio.
  const [open, setOpen] = useState<{ payment: AgendaPayment; tab: DrawerTab } | null>(() => { const payment = initialPayment; return payment ? { payment, tab: tabsFor(payment, isAdmin)[0] } : null; });
  const openPayment = open ? items.find((item) => item.id === open.payment.id) ?? open.payment : null;
  const openDrawer = (payment: AgendaPayment, tab?: DrawerTab) => setOpen({ payment, tab: tab ?? tabsFor(payment, isAdmin)[0] });
  const currencies = useMemo(() => sortCurrencies([...new Set(items.map((item) => item.currency))]), [items]);

  const visible = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase('es');
    return items.filter((item) => (!currency || item.currency === currency) && (!onlyToRemind || needsReminder(item, today)) && (!needle || [item.concept, clientName(item), item.project?.name ?? ''].some((text) => text.toLocaleLowerCase('es').includes(needle))));
  }, [items, currency, query, onlyToRemind, today]);
  const toRemind = items.filter((item) => needsReminder(item, today)).length;

  const toReview = items.filter((item) => item.status === 'UNDER_REVIEW');

  return (
    <div className="space-y-5">
      {toReview.length > 0 && (
        <div role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p>
            <b className="text-amber-700">{toReview.length === 1 ? '1 comprobante por verificar' : `${toReview.length} comprobantes por verificar`}</b>
            {' · '}{toReview.slice(0, 2).map((item) => `${clientName(item)} reportó ${formatCurrency(item.amount, item.currency)}`).join(' · ')}
          </p>
          {isAdmin && <Button size="sm" variant="outline" onClick={() => openDrawer(toReview[0], 'verify')}>Revisar</Button>}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <label className="relative min-w-52 flex-1 sm:max-w-xs">
          <span className="sr-only">Buscar cobro</span>
          <Search size={15} aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground" />
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar cliente, proyecto o concepto…" className="h-9 w-full rounded-md border bg-background pr-3 pl-9 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
        </label>
        {(toRemind > 0 || onlyToRemind) && (
          <button type="button" aria-pressed={onlyToRemind} onClick={() => setOnlyToRemind((value) => !value)} title="Vencidas o por vencer esta semana, sin recordatorio en los últimos 7 días" className="h-8 rounded-full border px-3 text-xs font-medium text-slate-700 transition hover:bg-slate-50 aria-pressed:border-blue-300 aria-pressed:bg-blue-50 aria-pressed:text-blue-800">
            Por recordar · {toRemind}
          </button>
        )}
        {currencies.length > 1 && (
          <div role="group" aria-label="Moneda" className="flex gap-1.5">
            {[null, ...currencies].map((option) => (
              <button key={option ?? 'all'} type="button" aria-pressed={currency === option} onClick={() => setCurrency(option)} className="h-8 rounded-full border px-3 text-xs font-medium text-slate-700 transition hover:bg-slate-50 aria-pressed:border-blue-300 aria-pressed:bg-blue-50 aria-pressed:text-blue-800">
                {option ?? 'Todas las monedas'}
              </button>
            ))}
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">Aún no hay cuotas. Crea la primera con «Nueva cuota» o desde las condiciones de pago de un proyecto.</p>
      ) : visible.length === 0 ? (
        <p className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">{onlyToRemind && !query ? 'No queda nada por recordar esta semana.' : 'Ningún cobro coincide con la búsqueda.'}</p>
      ) : (
        <div className="space-y-6">
          {GROUPS.map((group) => {
            const rows = visible.filter((item) => item.group === group.key);
            if (!rows.length) return null;
            const header = (
              <>
                <h2 className={`text-xs font-bold tracking-wider uppercase ${group.tone}`}>{group.title}</h2>
                <span className="text-xs text-muted-foreground">{rows.length}</span>
                <span className="ml-auto text-sm text-slate-700 tabular-nums">{totalsByCurrency(rows.map(owedOrPaid)).join(' · ')}</span>
              </>
            );
            const list = (
              <>
                {group.hint && <p className="px-1 pt-2 text-xs text-muted-foreground">{group.hint}</p>}
                <ul className="divide-y">{rows.map((payment) => <AgendaRow key={payment.id} payment={payment} today={today} tone={group.tone} isAdmin={isAdmin} onOpen={(tab) => openDrawer(payment, tab)} />)}</ul>
                {group.key === 'paid' && <p className="px-1 pt-3 text-sm"><Link className="text-muted-foreground underline underline-offset-4 hover:text-foreground" href={allPaid ? '/internal/payments' : '/internal/payments?cobrado=todo'}>{allPaid ? 'Ver solo los últimos 30 días' : 'Ver todo lo cobrado'}</Link></p>}
              </>
            );
            return group.collapsed ? (
              <details key={group.key} className="group/section">
                <summary className="flex cursor-pointer list-none items-baseline gap-2.5 border-b px-1 pb-2 [&::-webkit-details-marker]:hidden">
                  <span aria-hidden="true" className="text-xs text-muted-foreground transition group-open/section:rotate-90">▸</span>
                  {header}
                </summary>
                {list}
              </details>
            ) : (
              <section key={group.key} aria-label={group.title}>
                <div className="flex items-baseline gap-2.5 border-b px-1 pb-2">{header}</div>
                {list}
              </section>
            );
          })}
        </div>
      )}

      {open && openPayment && <PaymentDrawer key={`${open.payment.id}-${open.tab}`} payment={openPayment} initialTab={open.tab} today={today} isAdmin={isAdmin} reminder={reminder} onClose={() => setOpen(null)} />}
    </div>
  );
}

function AgendaRow({ payment, today, tone, isAdmin, onOpen }: { payment: AgendaPayment; today: string; tone: string; isAdmin: boolean; onOpen: (tab?: DrawerTab) => void }) {
  const context = [payment.project?.name, payment.milestone && payment.group !== 'awaitingMilestone' ? payment.milestone.title : null].filter(Boolean).join(' · ');
  const urgent = payment.group === 'overdue' || payment.group === 'week';
  return (
    <li className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 px-1 py-3 lg:grid-cols-[minmax(0,2.2fr)_minmax(0,1.2fr)_8rem_minmax(0,1.2fr)_15rem] lg:items-center">
      <div className="min-w-0">
        <button type="button" onClick={() => onOpen()} className="block max-w-full truncate text-left font-semibold text-slate-900 underline-offset-4 hover:underline">{payment.concept}</button>
        {context && <p className="truncate text-xs text-muted-foreground">{context}</p>}
      </div>
      <p className="col-start-1 truncate text-sm text-slate-700 lg:col-start-auto">{clientName(payment)}</p>
      <p className="col-start-2 row-start-1 text-right font-bold text-slate-900 tabular-nums lg:col-start-auto lg:row-start-auto">{formatCurrency(owedOrPaid(payment).amount, payment.currency)}</p>
      <div className="col-start-1 text-sm lg:col-start-auto">
        <p className={urgent ? `font-semibold ${tone}` : 'text-slate-700'}>{whenLabel(payment, today)}</p>
        {payment.group === 'awaitingMilestone' && payment.milestone && <p className="truncate text-xs text-muted-foreground">{payment.milestone.title}</p>}
        {payment.group !== 'paid' && payment.group !== 'awaitingMilestone' && payment.status !== 'UNDER_REVIEW' && (payment.lastReminderAt
          ? <p className="text-xs text-muted-foreground">{reminderLabel(payment.lastReminderAt, today)}</p>
          : urgent && <p className="text-xs text-muted-foreground">Aún sin recordar</p>)}
        {payment.status === 'UNDER_REVIEW' && <Tag className="border-amber-300 bg-amber-50 text-amber-800">Reportado · por verificar</Tag>}
        {payment.paidAmount > 0 && payment.status !== 'PAID' && <Tag className="border-slate-200 text-slate-700">Abonado {formatCurrency(payment.paidAmount, payment.currency)}</Tag>}
      </div>
      <div className="col-start-2 row-span-2 row-start-2 flex items-end justify-end gap-2 lg:col-start-auto lg:row-span-1 lg:row-start-auto lg:items-center">
        <RowActions payment={payment} isAdmin={isAdmin} onOpen={onOpen} />
      </div>
    </li>
  );
}

function Tag({ className, children }: { className: string; children: React.ReactNode }) {
  return <span className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-xs ${className}`}>{children}</span>;
}

function RowActions({ payment, isAdmin, onOpen }: { payment: AgendaPayment; isAdmin: boolean; onOpen: (tab: DrawerTab) => void }) {
  if (payment.group === 'awaitingMilestone') {
    return payment.projectId ? <Button asChild size="sm" variant="ghost"><Link href={`/internal/projects/${payment.projectId}/planning/milestones`}>Ver hito</Link></Button> : null;
  }
  const tabs = tabsFor(payment, isAdmin);
  if (tabs[0] === 'verify') return <Button size="sm" onClick={() => onOpen('verify')}>Verificar</Button>;
  if (tabs.includes('remind')) {
    const canRegister = tabs.includes('register');
    return (
      <>
        {payment.group === 'noDate'
          ? payment.projectId && <Button asChild size="sm" variant="ghost"><Link href={`/internal/projects/${payment.projectId}/documentation/payments`}>Poner fecha</Link></Button>
          : <Button size="sm" variant={canRegister ? 'ghost' : 'default'} onClick={() => onOpen('remind')}>Recordar</Button>}
        {canRegister && <Button size="sm" onClick={() => onOpen('register')}>Registrar pago</Button>}
      </>
    );
  }
  return <Button size="sm" variant="ghost" onClick={() => onOpen('history')}>Historial</Button>;
}
