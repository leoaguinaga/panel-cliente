'use client';

import { useCallback, useEffect, useState } from 'react';
import { Check, Copy, KeyRound, Link2, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { shortDate } from '@/src/modules/proposals/format';
import type { ProposalShare } from '@/src/modules/proposals/types';

async function call<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, headers: { 'Content-Type': 'application/json' } });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error((Array.isArray(data?.message) ? data.message.join('. ') : data?.message) || 'No se pudo completar');
  return data as T;
}

const field = 'block w-full rounded-lg border bg-background px-2.5 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring';

/**
 * Enlaces /p/<token> de una propuesta interactiva. El cliente la abre sin
 * login; el token se ve una sola vez, al crearlo.
 */
export function ProposalShares({ proposalId, canShare, draft, onChanged }: { proposalId: string; canShare: boolean; draft: boolean; onChanged: () => void }) {
  const [shares, setShares] = useState<ProposalShare[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [label, setLabel] = useState('');
  const [pin, setPin] = useState('');
  const [created, setCreated] = useState<{ url: string; label: string | null; pin: boolean } | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(() => {
    call<ProposalShare[]>(`/api/backend/proposals/${proposalId}/shares`)
      .then(setShares)
      .catch((err: Error) => setError(err.message));
  }, [proposalId]);
  useEffect(load, [load]);

  const create = async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await call<{ token: string; share: ProposalShare }>(`/api/backend/proposals/${proposalId}/shares`, {
        method: 'POST',
        body: JSON.stringify({ label: label.trim() || null, pin: pin.trim() || null }),
      });
      setCreated({ url: `${window.location.origin}/p/${result.token}`, label: result.share.label, pin: result.share.hasPin });
      setCopied(false);
      setLabel('');
      setPin('');
      load();
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el enlace');
    } finally {
      setBusy(false);
    }
  };

  const revoke = async (shareId: string) => {
    setBusy(true);
    setError(null);
    try {
      await call(`/api/backend/proposals/${proposalId}/shares/${shareId}/revoke`, { method: 'POST' });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo revocar');
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    if (!created) return;
    await navigator.clipboard.writeText(created.url).catch(() => undefined);
    setCopied(true);
  };

  const pinValid = pin === '' || /^\d{4,6}$/.test(pin);

  return (
    <div className="space-y-3">
      {canShare && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button type="button" size="sm" className="w-full gap-1.5" disabled={busy}>
              <Link2 className="size-4" aria-hidden="true" />
              Compartir enlace
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Compartir la propuesta</AlertDialogTitle>
              <AlertDialogDescription>
                El cliente la abre sin crear cuenta. El enlace muestra siempre la última versión enviada y deja de funcionar si lo revocas, si vence o si la propuesta se rechaza.
                {draft && ' Al crearlo, la propuesta pasa a «Enviada».'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-3">
              <label className="block text-[13px] font-medium">
                Para <span className="font-normal text-muted-foreground">(opcional)</span>
                <input value={label} onChange={(event) => setLabel(event.target.value)} maxLength={80} placeholder="Gerente, socio…" className={cn(field, 'mt-1.5 h-9')} />
              </label>
              <label className="block text-[13px] font-medium">
                PIN <span className="font-normal text-muted-foreground">(opcional, 4 a 6 dígitos)</span>
                <input value={pin} onChange={(event) => setPin(event.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="off" placeholder="Sin PIN" className={cn(field, 'mt-1.5 h-9 tracking-[0.3em] tabular-nums')} aria-invalid={!pinValid} />
                {!pinValid && <span className="mt-1 block text-xs text-amber-400">El PIN necesita al menos 4 dígitos.</span>}
              </label>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={create} disabled={!pinValid}>
                Crear enlace
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {created && (
        <div className="space-y-2 rounded-xl border border-primary/40 bg-primary/5 p-3" role="status">
          <p className="text-xs font-semibold">Enlace {created.label ? `para ${created.label}` : 'nuevo'} · cópialo ahora: no se vuelve a mostrar</p>
          <input readOnly value={created.url} onFocus={(event) => event.target.select()} className={cn(field, 'h-8 font-mono text-[11.5px]')} aria-label="Enlace de la propuesta" />
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant="outline" size="xs" className="gap-1" onClick={copy}>
              {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
              {copied ? 'Copiado' : 'Copiar'}
            </Button>
            <Button asChild variant="outline" size="xs" className="gap-1">
              <a href={`https://wa.me/?text=${encodeURIComponent(`Te comparto nuestra propuesta: ${created.url}`)}`} target="_blank" rel="noreferrer">
                <MessageCircle aria-hidden="true" />
                WhatsApp
              </a>
            </Button>
          </div>
          {created.pin && <p className="text-xs text-muted-foreground">Manda el PIN en un mensaje aparte.</p>}
        </div>
      )}

      {error && (
        <p role="alert" className="text-xs text-rose-400">
          {error}
        </p>
      )}

      {shares && shares.length > 0 && (
        <ul className="space-y-1.5" aria-label="Enlaces creados">
          {shares.map((share) => (
            <li key={share.id} className={cn('flex items-center justify-between gap-2 rounded-lg border px-2.5 py-2 text-xs', share.revokedAt && 'opacity-60')}>
              <div className="min-w-0">
                <p className="flex items-center gap-1 truncate font-semibold">
                  {share.label || 'Sin destinatario'}
                  {share.hasPin && <KeyRound className="size-3 shrink-0 text-muted-foreground" aria-label="Con PIN" />}
                  <span className="font-normal text-muted-foreground">· v{share.version}</span>
                </p>
                <p className="text-muted-foreground">
                  {share.revokedAt
                    ? `Revocado el ${shortDate(share.revokedAt)}`
                    : share.openCount
                      ? `Abierto ${share.openCount} ${share.openCount === 1 ? 'vez' : 'veces'} · última ${shortDate(share.lastOpenedAt!)}`
                      : `Sin abrir · creado ${shortDate(share.createdAt)}`}
                </p>
              </div>
              {!share.revokedAt && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button type="button" variant="ghost" size="xs" className="text-muted-foreground" disabled={busy}>
                      Revocar
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Revocar este enlace?</AlertDialogTitle>
                      <AlertDialogDescription>Quien lo tenga verá «Esta propuesta ya no está disponible». Los demás enlaces siguen funcionando.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => revoke(share.id)}>Revocar</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
