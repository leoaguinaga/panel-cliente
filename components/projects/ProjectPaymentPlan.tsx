'use client';

import { useMemo, useState } from 'react';
import { formatCurrency } from '@/lib/formatters';
import { Button } from '@/components/ui/button';
import { PaymentDrawer, tabsFor, type DrawerTab, type ReminderSettings } from '@/components/internal/payments/PaymentDrawer';
import { owedOrPaid, sortCurrencies, totalsByCurrency, whenLabel } from '@/components/internal/payments/agenda-format';
import type { AgendaPayment } from '@/src/modules/payments/server/queries';

const MILESTONE_STATE: Record<string, string> = {
  PENDING: 'sin iniciar',
  IN_PROGRESS: 'en curso',
  IN_REVIEW: 'en revisión del cliente',
  BLOCKED: 'bloqueado',
  APPROVED: 'aprobado',
  COMPLETED: 'aprobado',
};

/** Orden del plan: primero lo que no depende de un hito (anticipo), luego según el orden de los hitos. */
function planOrder(a: AgendaPayment, b: AgendaPayment) {
  const rank = (item: AgendaPayment) => (item.milestone ? (item.milestone.order ?? 0) + 1 : 0);
  return rank(a) - rank(b) || (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999');
}

const sumBy = (items: AgendaPayment[], pick: (item: AgendaPayment) => number) =>
  totalsByCurrency(items.map((item) => ({ currency: item.currency, amount: pick(item) })).filter((item) => item.amount > 0.005));

export function ProjectPaymentPlan({ items, today, isAdmin, reminder, projectPrice }: { items: AgendaPayment[]; today: string; isAdmin: boolean; reminder: ReminderSettings; projectPrice: number }) {
  const [open, setOpen] = useState<{ id: string; tab: DrawerTab } | null>(null);
  const plan = useMemo(() => [...items].sort(planOrder), [items]);
  const openPayment = open ? items.find((item) => item.id === open.id) : null;
  const total = plan.reduce((sum, item) => sum + item.amount, 0);
  const currencies = sortCurrencies([...new Set(plan.map((item) => item.currency))]);
  const single = currencies.length === 1 ? currencies[0] : null;
  const percentages = plan.map((item) => (item.percentage == null ? null : Number(item.percentage)));
  const split = percentages.every((value) => value !== null) ? percentages.join(' / ') : null;
  const unscheduled = single ? projectPrice - total : 0;

  if (!plan.length) {
    return <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">Este proyecto aún no tiene cuotas. Genera el plan con un esquema en «Editar plan».</p>;
  }

  const collected = sumBy(plan, (item) => item.paidAmount);
  return (
    <section aria-labelledby="plan-title" className="space-y-4">
      <div>
        <h2 id="plan-title" className="text-base font-bold text-slate-900">Plan de cuotas{split && <span className="font-normal text-muted-foreground"> · {split}</span>}</h2>
        <p className="mt-1 text-sm text-muted-foreground tabular-nums">
          Total {totalsByCurrency(plan).join(' · ')}
          {single && total > 0 && <> · cobrado {formatCurrency(plan.reduce((sum, item) => sum + item.paidAmount, 0), single)} ({Math.round((plan.reduce((sum, item) => sum + item.paidAmount, 0) / total) * 100)} %)</>}
        </p>
      </div>

      <ol className="grid overflow-hidden rounded-xl border bg-card sm:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(15rem,1fr))]">
        {plan.map((item, index) => <PlanCard key={item.id} item={item} index={index} total={total} today={today} isAdmin={isAdmin} onOpen={(tab) => setOpen({ id: item.id, tab: tab ?? tabsFor(item, isAdmin)[0] })} />)}
      </ol>

      <dl className="flex flex-wrap gap-x-8 gap-y-3 text-sm tabular-nums">
        <Total label="cobrado" values={collected} tone="text-emerald-700" />
        <Total label="por cobrar ahora" values={sumBy(plan.filter((item) => item.group !== 'awaitingMilestone' && item.group !== 'paid'), (item) => owedOrPaid(item).amount)} />
        <Total label="esperando hitos" values={sumBy(plan.filter((item) => item.group === 'awaitingMilestone'), (item) => item.amount)} />
        {single && Math.abs(unscheduled) > 0.005 && <Total label={unscheduled > 0 ? 'del precio sin programar' : 'programado sobre el precio'} values={[formatCurrency(Math.abs(unscheduled), single)]} tone="text-amber-700" />}
      </dl>

      {open && openPayment && <PaymentDrawer key={`${open.id}-${open.tab}`} payment={openPayment} initialTab={open.tab} today={today} isAdmin={isAdmin} reminder={reminder} onClose={() => setOpen(null)} />}
    </section>
  );
}

function Total({ label, values, tone = 'text-slate-900' }: { label: string; values: string[]; tone?: string }) {
  return <div><dt className="sr-only">{label}</dt><dd><b className={`block text-base ${tone}`}>{values.length ? values.join(' · ') : '—'}</b><span className="text-muted-foreground">{label}</span></dd></div>;
}

function PlanCard({ item, index, total, today, isAdmin, onOpen }: { item: AgendaPayment; index: number; total: number; today: string; isAdmin: boolean; onOpen: (tab?: DrawerTab) => void }) {
  const share = item.percentage != null ? Number(item.percentage) : total ? Math.round((item.amount / total) * 100) : 0;
  const paidShare = item.amount ? Math.min(100, (item.paidAmount / item.amount) * 100) : 0;
  const balance = item.amount - item.paidAmount;
  const tabs = tabsFor(item, isAdmin);
  const state =
    item.status === 'PAID' ? { text: 'Cobrada', className: 'border-emerald-300 bg-emerald-50 text-emerald-800' }
      : item.status === 'UNDER_REVIEW' ? { text: 'Reportada · por verificar', className: 'border-amber-300 bg-amber-50 text-amber-800' }
        : item.group === 'awaitingMilestone' ? { text: 'Esperando hito', className: 'border-sky-300 bg-sky-50 text-sky-800' }
          : item.paidAmount > 0 ? { text: `Parcial · falta ${formatCurrency(balance, item.currency)}`, className: 'border-slate-200 text-slate-700' }
            : item.group === 'overdue' ? { text: 'Vencida', className: 'border-rose-300 bg-rose-50 text-rose-800' }
              : { text: 'Por cobrar', className: 'border-slate-200 text-slate-700' };

  return (
    <li className="flex flex-col gap-2 border-b p-4 last:border-b-0 sm:[&:nth-child(odd)]:border-r lg:border-r lg:border-b-0 lg:last:border-r-0">
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
        <span className={`block h-full ${item.group === 'overdue' && !item.paidAmount ? 'bg-rose-600' : 'bg-emerald-600'}`} style={{ width: `${item.group === 'overdue' && !item.paidAmount ? 100 : paidShare}%` }} />
      </div>
      <p className="text-2xl leading-none font-bold text-slate-900 tabular-nums">{share} %<span className="sr-only">, cuota {index + 1}</span></p>
      <button type="button" onClick={() => onOpen()} className="text-left font-semibold text-slate-900 underline-offset-4 hover:underline">{item.concept}</button>
      <p className="text-xs text-muted-foreground">
        {item.milestone
          ? <>{item.milestone.title} — <span className={item.group === 'awaitingMilestone' ? 'text-sky-700' : undefined}>{MILESTONE_STATE[item.milestone.status] ?? item.milestone.status}</span></>
          : item.group === 'paid' ? whenLabel(item, today) : item.dueDate ? whenLabel(item, today) : 'Sin hito ni fecha'}
      </p>
      <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
        <b className="tabular-nums">{formatCurrency(item.amount, item.currency)}</b>
        <span className={`rounded-full border px-2 py-0.5 text-xs ${state.className}`}>{state.text}</span>
      </div>
      {tabs[0] !== 'history' && item.group !== 'awaitingMilestone' && (
        <div className="flex gap-2 pt-1">
          {tabs[0] === 'verify' && <Button size="sm" onClick={() => onOpen('verify')}>Verificar</Button>}
          {tabs.includes('register') && <Button size="sm" onClick={() => onOpen('register')}>Registrar pago</Button>}
          {tabs.includes('remind') && <Button size="sm" variant={tabs.includes('register') ? 'ghost' : 'default'} onClick={() => onOpen('remind')}>Recordar</Button>}
        </div>
      )}
    </li>
  );
}
