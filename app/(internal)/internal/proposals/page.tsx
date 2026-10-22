import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { requireAuth } from '@/src/lib/auth';
import { backendFetch } from '@/src/lib/api/server';
import { PROPOSAL_STATUS, formatMoney, proposalLabel, shortDate } from '@/src/modules/proposals/format';
import type { ProposalStatus } from '@/src/modules/proposals/types';

type Metrics = {
  days: number;
  sent: number;
  open: number;
  accepted: number;
  rejected: number;
  expired: number;
  closeRate: number | null;
  avgDaysToAccept: number | null;
  amounts: { currency: string; proposed: number; won: number; open: number }[];
};

type Row = {
  id: string;
  code: string;
  version: number;
  title: string;
  status: ProposalStatus;
  mode: 'DOCUMENT' | 'INTERACTIVE';
  currency: string;
  amountDue: number;
  validUntil: string | null;
  sentAt: string | null;
  projectId: string | null;
  updatedAt: string;
  lead: { id: string; name: string; companyName: string | null };
  preparedBy: { name: string } | null;
};

const PERIODS = [30, 90, 180, 365];
const FILTERS: { id: string; label: string }[] = [
  { id: '', label: 'Todas' },
  { id: 'SENT', label: 'Esperando respuesta' },
  { id: 'ACCEPTED', label: 'Aceptadas' },
  { id: 'DRAFT', label: 'Borradores' },
  { id: 'REJECTED', label: 'Rechazadas' },
  { id: 'EXPIRED', label: 'Vencidas' },
];

/** Embudo de propuestas: cuánto se propone, cuánto se gana y qué espera respuesta (F5). */
export default async function ProposalsPage({ searchParams }: { searchParams: Promise<{ days?: string; status?: string }> }) {
  await requireAuth(['ADMIN', 'WORKER']);
  const params = await searchParams;
  const days = PERIODS.includes(Number(params.days)) ? Number(params.days) : 90;
  const status = FILTERS.some((filter) => filter.id === params.status) ? (params.status ?? '') : '';
  const [metrics, rows] = await Promise.all([
    backendFetch<Metrics>(`/proposals/metrics?days=${days}`),
    backendFetch<Row[]>(`/proposals/index?days=${days}${status ? `&status=${status}` : ''}`),
  ]);
  const href = (next: { days?: number; status?: string }) => {
    const query = new URLSearchParams();
    const d = next.days ?? days;
    const s = next.status ?? status;
    if (d !== 90) query.set('days', String(d));
    if (s) query.set('status', s);
    const qs = query.toString();
    return `/internal/proposals${qs ? `?${qs}` : ''}`;
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link href="/internal/leads" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            Leads
          </Link>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Propuestas</h1>
          <p className="mt-1 text-sm text-muted-foreground">Cada propuesta cuenta una vez, con su última versión enviada. Los montos incluyen IGV.</p>
        </div>
        <nav aria-label="Periodo" className="flex rounded-lg border bg-muted p-1">
          {PERIODS.map((value) => (
            <Link
              key={value}
              href={href({ days: value })}
              aria-current={value === days ? 'page' : undefined}
              className={cn('rounded-md px-3 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground', value === days && 'bg-card text-foreground shadow-xs')}
            >
              {value === 365 ? '1 año' : `${value} días`}
            </Link>
          ))}
        </nav>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Tasa de cierre" value={metrics.closeRate === null ? '—' : `${Math.round(metrics.closeRate * 100)} %`} hint={`${metrics.accepted} aceptadas de ${metrics.accepted + metrics.rejected + metrics.expired} con respuesta`} />
        <Stat label="Esperando respuesta" value={String(metrics.open)} hint={`${metrics.sent} enviadas en ${days} días`} />
        <Stat label="Días hasta aceptar" value={metrics.avgDaysToAccept === null ? '—' : String(metrics.avgDaysToAccept)} hint="Promedio desde el envío" />
        <Stat
          label="Ganado / propuesto"
          value={metrics.amounts.length ? metrics.amounts.map((row) => formatMoney(row.won, row.currency)).join(' · ') : '—'}
          hint={metrics.amounts.length ? `de ${metrics.amounts.map((row) => formatMoney(row.proposed, row.currency)).join(' · ')}` : 'Sin propuestas enviadas'}
        />
      </div>

      <div className="rounded-2xl border bg-card">
        <nav aria-label="Filtrar por estado" className="flex flex-wrap gap-1.5 border-b p-3">
          {FILTERS.map((filter) => (
            <Link
              key={filter.id || 'all'}
              href={href({ status: filter.id })}
              aria-current={filter.id === status ? 'page' : undefined}
              className={cn('rounded-full border px-3 py-1 text-[13px] font-semibold text-muted-foreground hover:text-foreground', filter.id === status && 'border-foreground/40 bg-muted text-foreground')}
            >
              {filter.label}
            </Link>
          ))}
        </nav>
        {rows.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">No hay propuestas en este filtro. Se crean desde la hoja de cada lead.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">Propuesta</th>
                  <th className="px-4 py-2.5 font-semibold">Cliente</th>
                  <th className="px-4 py-2.5 font-semibold">Estado</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Total con IGV</th>
                  <th className="px-4 py-2.5 font-semibold">Enviada</th>
                  <th className="px-4 py-2.5 font-semibold">Vence</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-t hover:bg-muted/40">
                    <td className="px-4 py-3">
                      <Link href={`/internal/proposals/${row.id}`} className="font-semibold underline-offset-4 hover:underline">
                        {proposalLabel(row)}
                      </Link>
                      <span className="block text-xs text-muted-foreground">
                        {row.title}
                        {row.mode === 'INTERACTIVE' ? ' · interactiva' : ''}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/internal/leads?lead=${row.lead.id}`} className="underline-offset-4 hover:underline">
                        {row.lead.companyName || row.lead.name}
                      </Link>
                      {row.preparedBy && <span className="block text-xs text-muted-foreground">por {row.preparedBy.name}</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('rounded-full border px-2 py-0.5 text-[11.5px] font-semibold', PROPOSAL_STATUS[row.status].tone)}>{PROPOSAL_STATUS[row.status].label}</span>
                      {row.status === 'ACCEPTED' && !row.projectId && <span className="mt-1 block text-xs text-amber-400">Falta convertir</span>}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatMoney(row.amountDue, row.currency)}</td>
                    <td className="px-4 py-3 tabular-nums text-muted-foreground">{row.sentAt ? shortDate(row.sentAt) : '—'}</td>
                    <td className="px-4 py-3 tabular-nums text-muted-foreground">{row.validUntil && row.status === 'SENT' ? shortDate(row.validUntil) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-2xl border bg-card p-4">
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}
