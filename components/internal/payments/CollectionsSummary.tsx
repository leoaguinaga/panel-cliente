import { formatCurrency } from '@/lib/formatters';
import type { PaymentAgenda } from '@/src/modules/payments/server/queries';
import { currenciesWith, formatMonth, previousMonthOf } from './agenda-format';

/** Franja de tres cifras: por cobrar este mes, vencido y cobrado este mes. Cada moneda va por separado. */
export function CollectionsSummary({ summary }: { summary: PaymentAgenda['summary'] }) {
  const { currencies, today } = summary;
  const month = formatMonth(today);
  const due = currenciesWith(currencies, (totals) => totals.dueThisMonth);
  const overdue = currenciesWith(currencies, (totals) => totals.overdue);
  const collected = currenciesWith(currencies, (totals) => totals.collectedThisMonth);
  const previous = currenciesWith(currencies, (totals) => totals.collectedLastMonth);

  return (
    <div className="grid overflow-hidden rounded-xl border bg-card md:grid-cols-[1.3fr_1fr_1fr]">
      <Cell label={`Vence en ${month}`}>
        {due.length === 0 ? <Empty>Nada vence este mes</Empty> : due.map((currency, index) => {
          const totals = currencies[currency];
          const paid = (totals.paidOfThisMonth / totals.dueThisMonth) * 100;
          const late = (totals.overdueOfThisMonth / totals.dueThisMonth) * 100;
          return (
            <div key={currency} className={index ? 'mt-3' : ''}>
              <Amount primary={index === 0}>{formatCurrency(totals.dueThisMonth, currency)}</Amount>
              <div className="mt-2 flex h-1.5 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
                <span className="h-full bg-emerald-600" style={{ width: `${paid}%` }} />
                <span className="h-full bg-rose-600" style={{ width: `${late}%` }} />
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">
                {Math.round(paid)} % cobrado{late > 0 && <> · {Math.round(late)} % vencido</>}
              </p>
            </div>
          );
        })}
      </Cell>

      <Cell label="Vencido">
        {overdue.length === 0 ? <Empty>Nada vencido</Empty> : (
          <>
            {overdue.map((currency, index) => (
              <Amount key={currency} primary={index === 0} tone="text-rose-700">{formatCurrency(currencies[currency].overdue, currency)}</Amount>
            ))}
            <p className="mt-1.5 text-xs text-muted-foreground">
              {summary.overdueCount} {summary.overdueCount === 1 ? 'cuota' : 'cuotas'} · {summary.overdueClients} {summary.overdueClients === 1 ? 'cliente' : 'clientes'}
              {summary.oldestOverdueDays !== null && <> · la más antigua, hace {summary.oldestOverdueDays} {summary.oldestOverdueDays === 1 ? 'día' : 'días'}</>}
            </p>
          </>
        )}
      </Cell>

      <Cell label={`Cobrado en ${month}`}>
        {collected.length === 0 ? <Empty>Aún no entra nada</Empty> : collected.map((currency, index) => (
          <Amount key={currency} primary={index === 0} tone="text-emerald-700">{formatCurrency(currencies[currency].collectedThisMonth, currency)}</Amount>
        ))}
        {previous.length > 0 && (
          <p className="mt-1.5 text-xs text-muted-foreground">
            {formatMonth(previousMonthOf(today))}: {previous.map((currency) => formatCurrency(currencies[currency].collectedLastMonth, currency)).join(' · ')}
          </p>
        )}
      </Cell>
    </div>
  );
}

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-b p-5 last:border-b-0 md:border-b-0 md:border-l md:first:border-l-0">
      <p className="mb-1 text-xs font-medium text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}

function Amount({ primary, tone = 'text-slate-900', children }: { primary: boolean; tone?: string; children: React.ReactNode }) {
  return <p className={`tabular-nums ${primary ? `text-2xl font-bold tracking-tight ${tone}` : 'text-sm font-semibold text-slate-700'}`}>{children}</p>;
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="pt-1 text-sm text-muted-foreground">{children}</p>;
}
