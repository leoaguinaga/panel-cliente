'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Copy, ExternalLink, FileCode2, Lock, Monitor, Send, Smartphone, Trash2, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { RejectDialog, SummaryRow } from '@/components/proposals/ProposalEditor';
import { PROPOSAL_STATUS, formatMoney, proposalLabel, shortDate, stagePctSum, taxBreakdown, totalWeeks } from '@/src/modules/proposals/format';
import type { ProposalDetail } from '@/src/modules/proposals/types';
import { htmlUrl, uploadProposalHtml } from '@/src/modules/proposals/upload';

async function call<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, headers: { 'Content-Type': 'application/json' } });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error((Array.isArray(data?.message) ? data.message.join('. ') : data?.message) || 'No se pudo completar');
  return data as T;
}

const kb = (bytes: number | null) => (bytes ? `${Math.round(bytes / 1024)} KB` : '—');

/**
 * Propuesta interactiva: el HTML se diseña en Claude Code y aquí solo se ve,
 * se reemplaza y se marca enviada. Montos y opcionales salen de su manifiesto.
 */
export function InteractiveProposal({ initial }: { initial: ProposalDetail }) {
  const router = useRouter();
  const [proposal, setProposal] = useState(initial);
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Cambia con cada HTML nuevo para que el iframe no muestre el anterior desde la caché.
  const [revision, setRevision] = useState(initial.htmlUploadedAt ?? '');
  const fileInput = useRef<HTMLInputElement>(null);

  const draft = proposal.status === 'DRAFT';
  const status = PROPOSAL_STATUS[proposal.status];
  const business = proposal.lead.companyName || proposal.lead.name;
  const newerVersion = proposal.children[0];
  const tax = taxBreakdown(proposal.total, proposal.taxMode);
  const manifest = proposal.manifest;
  const weeks = manifest?.items.reduce((sum, item) => sum + (item.weeks ?? 0), 0) || totalWeeks(proposal.stages);
  const pctSum = stagePctSum(proposal.stages);

  const run = async (action: () => Promise<ProposalDetail | void>) => {
    setBusy(true);
    setError(null);
    try {
      const result = await action();
      if (result) setProposal(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo completar');
    } finally {
      setBusy(false);
    }
  };

  const replace = (file: File | undefined) =>
    file &&
    run(async () => {
      try {
        const updated = await uploadProposalHtml(`/api/backend/proposals/${proposal.id}/html`, file);
        setRevision(updated.htmlUploadedAt ?? String(Date.now()));
        return updated;
      } finally {
        if (fileInput.current) fileInput.current.value = '';
      }
    });

  const markSent = () =>
    run(async () => {
      const sent = await call<ProposalDetail>(`/api/backend/proposals/${proposal.id}/send`, { method: 'POST' });
      router.refresh();
      return sent;
    });

  const markRejected = (reason: string) => run(() => call<ProposalDetail>(`/api/backend/proposals/${proposal.id}/reject`, { method: 'POST', body: JSON.stringify({ reason: reason.trim() || null }) }));

  const newVersion = () =>
    run(async () => {
      const copy = await call<ProposalDetail>(`/api/backend/proposals/${proposal.id}/versions`, { method: 'POST' });
      router.push(`/internal/proposals/${copy.id}`);
    });

  const remove = () =>
    run(async () => {
      await call(`/api/backend/proposals/${proposal.id}`, { method: 'DELETE' });
      router.push(`/internal/leads?lead=${proposal.leadId}`);
    });

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <Link href={`/internal/leads?lead=${proposal.leadId}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            {business}
          </Link>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-semibold tracking-tight">Propuesta {proposalLabel(proposal)}</h1>
            <span className={cn('rounded-full border px-2 py-0.5 text-xs font-semibold', status.tone)}>{status.label}</span>
            <span className="rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">Interactiva</span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {proposal.title} · para {manifest?.client || business}
            {proposal.preparedBy ? ` · subida por ${proposal.preparedBy.name}` : ''}
          </p>
        </div>
        {draft && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" disabled={busy}>
                <Trash2 className="size-4" aria-hidden="true" />
                Eliminar borrador
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Eliminar el borrador {proposalLabel(proposal)}?</AlertDialogTitle>
                <AlertDialogDescription>Se borra esta versión y su HTML del panel. El archivo original sigue en foxcode/propuestas.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={remove}>Eliminar</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {!draft && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-3.5 text-sm">
          <p className="flex items-center gap-2">
            <Lock className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            {newerVersion
              ? `Esta versión ya no es la vigente: hay una v${newerVersion.version}.`
              : proposal.status === 'REJECTED'
                ? `Rechazada${proposal.rejectedAt ? ` el ${shortDate(proposal.rejectedAt)}` : ''}${proposal.rejectionReason ? `: ${proposal.rejectionReason}` : '.'} Puedes seguir con una versión nueva.`
                : proposal.status === 'EXPIRED'
                  ? 'Venció sin respuesta. Crea una versión nueva con fechas al día o márcala como rechazada.'
                  : proposal.status === 'ACCEPTED'
                    ? 'Aceptada.'
                    : `Enviada${proposal.sentAt ? ` el ${shortDate(proposal.sentAt)}` : ''}. Para cambiarla se sube un HTML nuevo en otra versión y esta queda como estaba.`}
          </p>
          {newerVersion ? (
            <Button asChild variant="outline" size="sm">
              <Link href={`/internal/proposals/${newerVersion.id}`}>Ir a la v{newerVersion.version}</Link>
            </Button>
          ) : (
            proposal.status !== 'ACCEPTED' && (
              <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={newVersion} disabled={busy}>
                <Copy className="size-4" aria-hidden="true" />
                Nueva versión (v{proposal.version + 1})
              </Button>
            )
          )}
        </div>
      )}

      {error && (
        <p role="alert" className="whitespace-pre-line rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-400">
          {error}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 overflow-hidden rounded-2xl border bg-card">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2">
            <div className="flex gap-1" role="group" aria-label="Tamaño de la vista previa">
              <Button type="button" variant={device === 'desktop' ? 'secondary' : 'ghost'} size="xs" className="gap-1" aria-pressed={device === 'desktop'} onClick={() => setDevice('desktop')}>
                <Monitor aria-hidden="true" />
                Escritorio
              </Button>
              <Button type="button" variant={device === 'mobile' ? 'secondary' : 'ghost'} size="xs" className="gap-1" aria-pressed={device === 'mobile'} onClick={() => setDevice('mobile')}>
                <Smartphone aria-hidden="true" />
                Móvil
              </Button>
            </div>
            <Button asChild variant="ghost" size="xs" className="gap-1">
              <a href={htmlUrl(proposal.id)} target="_blank" rel="noreferrer">
                <ExternalLink aria-hidden="true" />
                Abrir en otra pestaña
              </a>
            </Button>
          </div>
          <div className="bg-muted/40 p-3">
            {/* El aislamiento lo pone el servidor (CSP `sandbox`, sin allow-same-origin): la propuesta
                no puede leer la sesión ni llamar a la API del panel. El atributo sandbox del iframe
                se omite porque algunos navegadores bloquean esos marcos. */}
            <iframe
              key={revision}
              title={`Vista previa de ${proposalLabel(proposal)}`}
              src={`${htmlUrl(proposal.id)}${revision ? `?r=${encodeURIComponent(revision)}` : ''}`}
              referrerPolicy="no-referrer"
              className={cn('mx-auto block h-[78vh] rounded-lg border bg-[#18181a]', device === 'mobile' ? 'w-[390px] max-w-full' : 'w-full')}
            />
          </div>
        </div>

        <aside className="h-fit space-y-4 rounded-2xl border bg-card p-5 lg:sticky lg:top-6" aria-label="Resumen de la propuesta">
          <div>
            <p className="text-xs font-semibold text-muted-foreground">Total</p>
            <p className="text-2xl font-semibold tabular-nums">{formatMoney(proposal.total, proposal.currency)}</p>
            <p className="text-xs text-muted-foreground">
              {proposal.taxMode === 'PLUS_IGV' ? `+ IGV ${formatMoney(tax.igv, proposal.currency)} · a pagar ${formatMoney(tax.total, proposal.currency)}` : `IGV incluido (${formatMoney(tax.igv, proposal.currency)})`}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Sin opcionales: el cliente los elige en la página.</p>
          </div>
          <dl className="space-y-2 border-t pt-4 text-[13px]">
            <SummaryRow label="Módulos">{proposal.items.length}</SummaryRow>
            <SummaryRow label="Opcionales ofrecidos">{proposal.addons.length}</SummaryRow>
            <SummaryRow label="Plazo">{weeks} semanas</SummaryRow>
            <SummaryRow label="Cuotas">
              <span className={cn(pctSum !== 100 && 'text-amber-400')}>{proposal.stages.filter((stage) => stage.paymentPct > 0).map((stage) => stage.paymentPct).join(' / ')} %</span>
            </SummaryRow>
            <SummaryRow label="Válida hasta">{proposal.validUntil ? shortDate(proposal.validUntil) : '—'}</SummaryRow>
            <SummaryRow label="Secciones">{manifest?.sections.length ?? '—'}</SummaryRow>
            <SummaryRow label="Archivo">{kb(proposal.htmlBytes)}{proposal.htmlUploadedAt ? ` · ${shortDate(proposal.htmlUploadedAt)}` : ''}</SummaryRow>
          </dl>
          <div className="space-y-2 border-t pt-4">
            <div className="grid grid-cols-2 gap-2">
              <Button asChild variant="outline" size="sm" className="gap-1.5">
                <a href={htmlUrl(proposal.id, true)} download>
                  <FileCode2 className="size-4" aria-hidden="true" />
                  HTML
                </a>
              </Button>
              <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => fileInput.current?.click()} disabled={busy || !draft}>
                <Upload className="size-4" aria-hidden="true" />
                {busy && draft ? 'Subiendo…' : 'Reemplazar'}
              </Button>
              <input ref={fileInput} type="file" accept=".html,text/html" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(event) => replace(event.target.files?.[0])} />
            </div>
            {draft && (
              <>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button type="button" size="sm" className="w-full gap-1.5" disabled={busy}>
                      <Send className="size-4" aria-hidden="true" />
                      Marcar enviada
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Marcar {proposalLabel(proposal)} como enviada?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta versión queda congelada con el HTML de hoy: los cambios irán en una versión nueva. El lead pasa a «Cotizado» y se agenda un seguimiento en 3 días.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={markSent}>Marcar enviada</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <p className="text-xs text-muted-foreground">Por ahora: descarga el HTML, mándalo al cliente y márcala como enviada. Pronto se compartirá con un enlace del panel.</p>
              </>
            )}
            {(proposal.status === 'SENT' || proposal.status === 'EXPIRED') && !newerVersion && <RejectDialog busy={busy} onConfirm={markRejected} />}
          </div>
        </aside>
      </div>
    </section>
  );
}
