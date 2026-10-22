'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { formatMoney, proposalLabel, shortDate } from '@/src/modules/proposals/format';

export type ClientProposal = {
  id: string; code: string; version: number; title: string;
  status: 'SENT' | 'EXPIRED' | 'ACCEPTED' | 'REJECTED';
  currency: string; amountDue: number; validUntil: string | null; sentAt: string | null; hasPdf: boolean;
  preparedBy: { name: string; email: string } | null;
};

const LABEL: Record<ClientProposal['status'], string> = { SENT: 'Esperando tu respuesta', EXPIRED: 'Vencida', ACCEPTED: 'Aceptada', REJECTED: 'Rechazada' };

/** F5: el cliente con cuenta acepta o rechaza la propuesta; el equipo luego la convierte en proyecto. */
export function ClientProposals({ proposals }: { proposals: ClientProposal[] }) {
  const router = useRouter();
  const [accepting, setAccepting] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const act = async (id: string, action: 'accept' | 'decline', body: object) => {
    setBusy(true); setError(null);
    const response = await fetch(`/api/backend/proposals/portal/${id}/${action}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await response.json().catch(() => null);
    setBusy(false);
    if (!response.ok) return setError((Array.isArray(data?.message) ? data.message.join('. ') : data?.message) || 'No se pudo registrar tu respuesta');
    setAccepting(null); router.refresh();
  };

  if (proposals.length === 0) return <p className="rounded-2xl border bg-card p-6 text-sm text-slate-600">No tienes propuestas pendientes.</p>;
  return (
    <ul className="space-y-4">
      {proposals.map((p) => (
        <li key={p.id} className="rounded-2xl border bg-card p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-slate-500">{proposalLabel(p)}</p>
              <h2 className="text-lg font-semibold text-slate-950">{p.title}</h2>
              <p className="mt-1 text-sm text-slate-600">
                {formatMoney(p.amountDue, p.currency)} con IGV
                {p.sentAt ? ` · enviada el ${shortDate(p.sentAt)}` : ''}
                {p.status === 'SENT' && p.validUntil ? ` · válida hasta el ${shortDate(p.validUntil)}` : ''}
              </p>
            </div>
            <span className="rounded-full border px-2.5 py-0.5 text-xs font-semibold text-slate-700">{LABEL[p.status]}</span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {p.hasPdf && <Button asChild variant="outline" size="sm"><a href={`/api/backend/proposals/portal/${p.id}/pdf`} target="_blank" rel="noreferrer">Ver PDF</a></Button>}
            {p.status === 'SENT' && accepting !== p.id && (
              <>
                <Button size="sm" onClick={() => { setAccepting(p.id); setError(null); }}>Aceptar propuesta</Button>
                <Button variant="ghost" size="sm" disabled={busy} onClick={() => { const reason = window.prompt('¿Nos cuentas por qué? (opcional)') ?? undefined; if (reason !== undefined) void act(p.id, 'decline', { reason }); }}>No, gracias</Button>
              </>
            )}
          </div>
          {accepting === p.id && (
            <form className="mt-4 grid gap-3 rounded-xl border p-4 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); void act(p.id, 'accept', { name, role }); }}>
              <label className="text-sm font-medium">Tu nombre<input required maxLength={120} value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block h-9 w-full rounded-lg border px-2.5" /></label>
              <label className="text-sm font-medium">Cargo <span className="font-normal text-slate-500">(opcional)</span><input maxLength={120} value={role} onChange={(e) => setRole(e.target.value)} className="mt-1 block h-9 w-full rounded-lg border px-2.5" /></label>
              <p className="text-xs text-slate-600 sm:col-span-2">Al aceptar, autorizas a FoxCode a preparar el contrato con este alcance y precio. El contrato se firma aparte.</p>
              <div className="flex gap-2 sm:col-span-2"><Button type="submit" size="sm" disabled={busy}>{busy ? 'Enviando…' : 'Confirmar aceptación'}</Button><Button type="button" variant="ghost" size="sm" onClick={() => setAccepting(null)}>Cancelar</Button></div>
            </form>
          )}
          {error && accepting === p.id && <p role="alert" className="mt-2 text-sm text-rose-600">{error}</p>}
        </li>
      ))}
    </ul>
  );
}
