'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, CheckCircle2, FileSignature, HandHeart, Paperclip } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { formatMoney, proposalLabel, shortDate } from '@/src/modules/proposals/format';
import type { ProposalDetail } from '@/src/modules/proposals/types';

type ConversionPreview = {
  client: { existing: boolean; name: string };
  duplicateClients: boolean;
  project: { name: string; type: string };
  currency: string;
  total: number;
  milestones: { order: number; title: string; description: string | null; startDate: string; dueDate: string }[];
  payments: { concept: string; amount: number; paymentPct: number; atSigning: boolean }[];
  firstPaymentDays: number;
};

const errorMessage = (data: { message?: string | string[] } | null, fallback: string) =>
  (Array.isArray(data?.message) ? data.message.join('. ') : data?.message) || fallback;

/**
 * Cierre de la propuesta (F3/F4): aceptar y convertir el lead en proyecto, y
 * después descargar el contrato y el kit de bienvenida con los datos reales.
 */
export function ProposalClosing({ proposal, isAdmin }: { proposal: ProposalDetail; isAdmin: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<ConversionPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const converted = Boolean(proposal.projectId);
  const latest = proposal.children.length === 0;
  const acceptable = !converted && latest && ['SENT', 'EXPIRED', 'ACCEPTED'].includes(proposal.status);
  if (!converted && !acceptable) return null;

  const openDialog = async () => {
    setOpen(true);
    setError(null);
    setPreview(null);
    const response = await fetch(`/api/backend/proposals/${proposal.id}/conversion`);
    const data = await response.json().catch(() => null);
    if (!response.ok) setError(errorMessage(data, 'No se pudo preparar la conversión'));
    else setPreview(data as ConversionPreview);
  };

  const accept = async () => {
    setBusy(true);
    setError(null);
    const form = new FormData();
    if (note.trim()) form.set('note', note.trim());
    if (file) form.set('file', file);
    try {
      const response = await fetch(`/api/backend/proposals/${proposal.id}/accept`, { method: 'POST', body: form });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(errorMessage(data, 'No se pudo aceptar la propuesta'));
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo aceptar la propuesta');
    } finally {
      setBusy(false);
    }
  };

  if (converted) {
    return (
      <section aria-labelledby="closing-title" className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 id="closing-title" className="flex items-center gap-2 text-lg font-semibold">
              <CheckCircle2 className="size-5 text-emerald-400" aria-hidden="true" />
              Aceptada{proposal.acceptedAt ? ` el ${shortDate(proposal.acceptedAt)}` : ''}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {proposal.acceptance
                ? `La aceptó ${proposal.acceptance.name}${proposal.acceptance.role ? ` (${proposal.acceptance.role})` : ''} desde el enlace, con el correo ${proposal.acceptance.email}. `
                : proposal.acceptedBy
                  ? `Registrada por ${proposal.acceptedBy.name}. `
                  : ''}
              El proyecto ya tiene su alcance, hitos y cuotas. Siguiente paso: enviar el contrato para firma.
            </p>
          </div>
          <Button asChild size="sm" className="gap-1.5">
            <Link href={`/internal/projects/${proposal.projectId}`}>
              Ir al proyecto
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <a href={`/api/backend/proposals/${proposal.id}/contract`} download>
              <FileSignature className="size-4" aria-hidden="true" />
              Contrato (PDF)
            </a>
          </Button>
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <a href={`/api/backend/proposals/${proposal.id}/welcome`} download>
              <HandHeart className="size-4" aria-hidden="true" />
              Kit de bienvenida (PDF)
            </a>
          </Button>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Los datos de FoxCode (razón social, RUC, representante, cuenta) salen de Configuración › Empresa y Portal. El contrato firmado súbelo en Documentos del proyecto como «Contrato firmado».
        </p>
      </section>
    );
  }

  return (
    <section aria-labelledby="closing-title" className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-card p-5 sm:p-6">
      <div className="min-w-0">
        <h2 id="closing-title" className="text-lg font-semibold">
          {proposal.status === 'ACCEPTED'
            ? `${proposal.acceptance?.name ?? 'El cliente'} la aceptó en línea, pero falta crear el proyecto`
            : '¿El cliente dijo que sí?'}
        </h2>
        <p className="mt-1 max-w-prose text-sm text-muted-foreground">
          Al aceptarla se crea el cliente y el proyecto con el alcance, los 4 hitos y las cuotas de esta propuesta. Después descargas el contrato y el kit de bienvenida.
        </p>
      </div>
      {isAdmin ? (
        <Button type="button" size="sm" className="gap-1.5" onClick={openDialog}>
          <CheckCircle2 className="size-4" aria-hidden="true" />
          {proposal.status === 'ACCEPTED' ? 'Convertir en proyecto' : 'Marcar aceptada'}
        </Button>
      ) : (
        <p className="text-xs text-muted-foreground">Solo un administrador la marca aceptada, porque crea las cuotas.</p>
      )}

      <AlertDialog open={open} onOpenChange={(value) => !busy && setOpen(value)}>
        <AlertDialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Aceptar {proposalLabel(proposal)} y crear el proyecto</AlertDialogTitle>
            <AlertDialogDescription>Revisa lo que se va a crear. No se puede deshacer desde aquí.</AlertDialogDescription>
          </AlertDialogHeader>

          {!preview && !error && <div className="h-40 animate-pulse rounded-xl border bg-muted motion-reduce:animate-none" aria-label="Preparando la conversión" />}
          {preview && (
            <div className="space-y-4 text-sm">
              <dl className="grid grid-cols-[110px_minmax(0,1fr)] gap-x-3 gap-y-1.5">
                <dt className="text-muted-foreground">Cliente</dt>
                <dd className="font-medium">
                  {preview.client.name}{' '}
                  <span className={cn('ml-1 rounded-full border px-1.5 text-[11px] font-semibold', preview.client.existing ? 'border-sky-500/40 text-sky-400' : 'border-emerald-500/40 text-emerald-400')}>
                    {preview.client.existing ? 'ya existe' : 'nuevo'}
                  </span>
                </dd>
                <dt className="text-muted-foreground">Proyecto</dt>
                <dd className="font-medium">{preview.project.name}</dd>
                <dt className="text-muted-foreground">Total a cobrar</dt>
                <dd className="font-medium tabular-nums">{formatMoney(preview.total, preview.currency)}</dd>
              </dl>
              <div className="overflow-hidden rounded-xl border">
                <table className="w-full text-[13px]">
                  <thead className="bg-muted/60 text-left text-xs text-muted-foreground">
                    <tr><th className="px-3 py-2 font-semibold">Hito</th><th className="px-3 py-2 font-semibold">Vence</th></tr>
                  </thead>
                  <tbody>
                    {preview.milestones.map((milestone) => (
                      <tr key={milestone.order} className="border-t">
                        <td className="px-3 py-2"><b className="font-semibold">{milestone.title}</b>{milestone.description && <span className="block text-xs text-muted-foreground">{milestone.description}</span>}</td>
                        <td className="px-3 py-2 tabular-nums text-muted-foreground">{shortDate(milestone.dueDate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <ul className="space-y-1.5">
                {preview.payments.map((payment) => (
                  <li key={payment.concept} className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-[13px]">
                    <span className="min-w-0">
                      {payment.concept}
                      <span className="block text-xs text-muted-foreground">{payment.atSigning ? `Por cobrar: vence en ${preview.firstPaymentDays} días` : 'Programada: se cobra cuando se apruebe su hito'}</span>
                    </span>
                    <b className="shrink-0 font-semibold tabular-nums">{formatMoney(payment.amount, preview.currency)}</b>
                  </li>
                ))}
              </ul>
              <label className="block text-[13px] font-medium">
                Nota <span className="font-normal text-muted-foreground">(opcional)</span>
                <textarea rows={2} maxLength={500} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Aceptó por correo el 21 de octubre…" className="mt-1.5 block w-full resize-y rounded-lg border bg-background px-2.5 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
              </label>
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed px-3 py-2.5 text-[13px] text-muted-foreground hover:text-foreground">
                <Paperclip className="size-4 shrink-0" aria-hidden="true" />
                <span className="min-w-0 truncate">{file ? file.name : 'Adjuntar respaldo: página de aceptación firmada o el correo (opcional)'}</span>
                <input type="file" accept="application/pdf,image/png,image/jpeg,image/webp" className="sr-only" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
              </label>
            </div>
          )}
          {error && <p role="alert" className="rounded-lg border border-rose-500/40 bg-rose-500/10 p-2.5 text-sm text-rose-400">{error}</p>}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancelar</AlertDialogCancel>
            <Button type="button" onClick={accept} disabled={busy || !preview || preview.duplicateClients}>
              {busy ? 'Creando…' : 'Aceptar y crear proyecto'}
            </Button>
          </AlertDialogFooter>
          {preview?.duplicateClients && <p className="text-xs text-amber-400">Hay dos clientes con el correo del lead: resuélvelo en Clientes antes de convertir.</p>}
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
