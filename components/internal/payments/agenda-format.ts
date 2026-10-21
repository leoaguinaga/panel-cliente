import { formatCurrency } from '@/lib/formatters';
import type { AgendaPayment, CurrencyTotals } from '@/src/modules/payments/server/queries';

const CURRENCY_ORDER = ['USD', 'PEN'];

/** USD primero, luego PEN, luego cualquier otra moneda en orden alfabético. */
export function sortCurrencies(currencies: string[]) {
  const rank = (currency: string) => {
    const index = CURRENCY_ORDER.indexOf(currency);
    return index === -1 ? CURRENCY_ORDER.length : index;
  };
  return [...currencies].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
}

/** Suma por moneda, sin mezclar: «USD 2,950.00 · S/ 1,200.00». */
export function totalsByCurrency(items: Pick<AgendaPayment, 'amount' | 'currency'>[]) {
  const totals = new Map<string, number>();
  for (const item of items) totals.set(item.currency, (totals.get(item.currency) ?? 0) + item.amount);
  return sortCurrencies([...totals.keys()]).map((currency) => formatCurrency(totals.get(currency)!, currency));
}

export function currenciesWith(currencies: Record<string, CurrencyTotals>, pick: (totals: CurrencyTotals) => number) {
  return sortCurrencies(Object.keys(currencies)).filter((currency) => pick(currencies[currency]) > 0);
}

/** En grupos por cobrar importa el saldo; en cobrado y esperando hito, el monto. */
export function owedOrPaid(payment: Pick<AgendaPayment, 'amount' | 'paidAmount' | 'currency' | 'group'>) {
  const owed = payment.group !== 'paid' && payment.group !== 'awaitingMilestone';
  return { currency: payment.currency, amount: owed ? payment.amount - payment.paidAmount : payment.amount };
}

const limaDayFormat = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit' });
export const limaDay = (value: string) => limaDayFormat.format(new Date(value));

const REMIND_AFTER_DAYS = 7;
/** Por cobrar con urgencia y sin recordatorio en la última semana. */
export function needsReminder(payment: Pick<AgendaPayment, 'group' | 'status' | 'lastReminderAt'>, today: string) {
  if (payment.group !== 'overdue' && payment.group !== 'week') return false;
  if (payment.status === 'UNDER_REVIEW') return false;
  return !payment.lastReminderAt || daysBetween(limaDay(payment.lastReminderAt), today) >= REMIND_AFTER_DAYS;
}

export function reminderLabel(lastReminderAt: string, today: string) {
  const days = daysBetween(limaDay(lastReminderAt), today);
  return days <= 0 ? 'Recordado hoy' : days === 1 ? 'Recordado ayer' : `Recordado hace ${days} días`;
}

const dayMs = 86_400_000;
export const daysBetween = (from: string, to: string) => Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / dayMs);

const weekday = new Intl.DateTimeFormat('es-PE', { weekday: 'long', day: 'numeric', timeZone: 'UTC' });
const shortDate = new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: '2-digit', timeZone: 'UTC' });
const monthName = new Intl.DateTimeFormat('es-PE', { month: 'long', timeZone: 'UTC' });

export const formatShortDate = (value: string) => shortDate.format(new Date(value));
export const formatMonth = (day: string) => monthName.format(new Date(`${day.slice(0, 7)}-01T00:00:00Z`)).toLocaleLowerCase('es');
export function previousMonthOf(day: string) {
  const date = new Date(`${day.slice(0, 7)}-01T00:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() - 1);
  return date.toISOString().slice(0, 10);
}

/** Texto principal de la columna de fecha según el grupo. */
export function whenLabel(payment: AgendaPayment, today: string) {
  if (payment.group === 'paid') return payment.paidAt ? `cobrado el ${formatShortDate(payment.paidAt)}` : 'cobrado';
  if (payment.group === 'awaitingMilestone') return payment.milestone ? 'al aprobar el hito' : 'esperando hito';
  if (!payment.dueDate) return 'sin fecha';
  const due = payment.dueDate.slice(0, 10);
  const diff = daysBetween(today, due);
  if (diff < 0) return diff === -1 ? 'venció ayer' : `hace ${-diff} días`;
  if (diff === 0) return 'vence hoy';
  if (diff === 1) return 'vence mañana';
  if (payment.group === 'week') return `vence el ${weekday.format(new Date(due)).toLocaleLowerCase('es')}`;
  return `en ${diff} días · ${formatShortDate(due)}`;
}
