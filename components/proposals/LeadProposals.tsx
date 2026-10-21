'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronDown, Download, FileText, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { PROPOSAL_STATUS, formatMoney, layerShort, proposalLabel, shortDate } from '@/src/modules/proposals/format';
import type { Proposal } from '@/src/modules/proposals/types';

async function call<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, headers: { 'Content-Type': 'application/json' } });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error((Array.isArray(data?.message) ? data.message.join('. ') : data?.message) || 'No se pudo completar');
  return data as T;
}

/** Sección «Propuestas» de la hoja del lead: la última versión de cada código y sus anteriores plegadas. */
export function LeadProposals({ leadId, disabled }: { leadId: string; disabled?: boolean }) {
  const router = useRouter();
  const [proposals, setProposals] = useState<Proposal[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let alive = true;
    call<Proposal[]>(`/api/backend/leads/${leadId}/proposals`)
      .then((rows) => alive && setProposals(rows))
      .catch((err: Error) => alive && setError(err.message));
    return () => {
      alive = false;
    };
  }, [leadId]);

  const create = async () => {
    setCreating(true);
    setError(null);
    try {
      const proposal = await call<Proposal>(`/api/backend/leads/${leadId}/proposals`, { method: 'POST' });
      router.push(`/internal/proposals/${proposal.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear la propuesta');
      setCreating(false);
    }
  };

  // Llegan ordenadas por código y versión descendente: la primera de cada código es la vigente.
  const groups = new Map<string, Proposal[]>();
  for (const proposal of proposals ?? []) groups.set(proposal.code, [...(groups.get(proposal.code) ?? []), proposal]);

  return (
    <div className="space-y-2">
      {proposals === null && !error && <div className="h-[86px] animate-pulse rounded-xl border bg-card motion-reduce:animate-none" aria-label="Cargando propuestas" />}
      {[...groups.values()].map(([latest, ...older]) => (
        <ProposalCard key={latest.id} proposal={latest} older={older} />
      ))}
      {proposals?.length === 0 && (
        <p className="rounded-xl border border-dashed p-3 text-sm text-muted-foreground">Arma la propuesta aquí: hereda el negocio del lead y se imprime con el diseño de FoxCode.</p>
      )}
      {error && (
        <p role="alert" className="text-xs text-rose-400">
          {error}
        </p>
      )}
      {!disabled && (
        <Button type="button" variant="outline" size="xs" className="gap-1" onClick={create} disabled={creating || proposals === null}>
          <Plus aria-hidden="true" />
          {creating ? 'Creando…' : 'Nueva propuesta'}
        </Button>
      )}
    </div>
  );
}

function ProposalCard({ proposal, older }: { proposal: Proposal; older: Proposal[] }) {
  const status = PROPOSAL_STATUS[proposal.status];
  const layers = proposal.layers.map(layerShort).join(' + ');
  return (
    <div className="rounded-xl border bg-card p-3.5 text-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11.5px] font-semibold tabular-nums text-muted-foreground">{proposalLabel(proposal)}</p>
          <p className="truncate font-semibold">
            {proposal.title}
            {layers && <span className="font-normal text-muted-foreground"> · {layers}</span>}
          </p>
        </div>
        <span className={cn('shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-semibold', status.tone)}>{status.label}</span>
      </div>
      <dl className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] text-muted-foreground">
        <div>
          <dt className="sr-only">Total</dt>
          <dd>
            <b className="font-semibold text-foreground tabular-nums">{formatMoney(proposal.total, proposal.currency)}</b> {proposal.taxMode === 'PLUS_IGV' ? '+ IGV' : 'IGV incl.'}
          </dd>
        </div>
        {proposal.sentAt && (
          <div>
            <dt className="inline">Enviada </dt>
            <dd className="inline text-foreground">{shortDate(proposal.sentAt)}</dd>
          </div>
        )}
        {proposal.validUntil && (
          <div>
            <dt className="inline">Válida hasta </dt>
            <dd className="inline text-foreground">{shortDate(proposal.validUntil)}</dd>
          </div>
        )}
      </dl>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <Button asChild variant="outline" size="xs" className="gap-1">
          <Link href={`/internal/proposals/${proposal.id}`}>
            <FileText aria-hidden="true" />
            {proposal.status === 'DRAFT' ? 'Seguir editando' : 'Ver propuesta'}
          </Link>
        </Button>
        <Button asChild variant="ghost" size="xs" className="gap-1">
          <a href={`/api/backend/proposals/${proposal.id}/pdf`} download>
            <Download aria-hidden="true" />
            PDF
          </a>
        </Button>
      </div>
      {older.length > 0 && (
        <details className="group mt-3 border-t pt-2.5">
          <summary className="flex cursor-pointer list-none items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground [&::-webkit-details-marker]:hidden">
            {older.length === 1 ? 'Versión anterior' : `${older.length} versiones anteriores`}
            <ChevronDown className="size-3 transition-transform group-open:rotate-180" aria-hidden="true" />
          </summary>
          <ul className="mt-2 space-y-1">
            {older.map((version) => (
              <li key={version.id} className="flex items-center justify-between gap-2 text-xs">
                <Link href={`/internal/proposals/${version.id}`} className="font-semibold underline-offset-4 hover:underline">
                  v{version.version}
                </Link>
                <span className="text-muted-foreground tabular-nums">{formatMoney(version.total, version.currency)}</span>
                <span className={cn('rounded-full border px-1.5 text-[10.5px] font-semibold', PROPOSAL_STATUS[version.status].tone)}>{PROPOSAL_STATUS[version.status].label}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
