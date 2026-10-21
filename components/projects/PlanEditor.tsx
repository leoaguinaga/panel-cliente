'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Lock, MoreHorizontal, NotebookPen, Plus, Wand2 } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { applyPaymentPresetAction } from '@/src/modules/projects/server/actions';
import type { ProjectPayment } from '@/src/modules/projects/types';

const PRESETS = [
  { id: 'FULL_100', split: [100], label: 'Pago único' },
  { id: 'SPLIT_50_50', split: [50, 50], label: 'Anticipo y entrega' },
  { id: 'SPLIT_70_30', split: [70, 30], label: 'Anticipo alto' },
  { id: 'SPLIT_50_20_30', split: [50, 20, 30], label: 'Tres hitos' },
] as const;

type Row = { concept: string; amount: string; dueDate: string; milestoneId: string; notes: string };
const rowOf = (payment: ProjectPayment): Row => ({
  concept: payment.concept,
  amount: String(Number(payment.amount)),
  dueDate: payment.dueDate?.slice(0, 10) ?? '',
  milestoneId: payment.milestoneId ?? '',
  notes: payment.notes ?? '',
});
const sameRow = (a: Row, b: Row) => a.concept === b.concept && Number(a.amount) === Number(b.amount) && a.dueDate === b.dueDate && a.milestoneId === b.milestoneId && a.notes === b.notes;

const pctFormat = new Intl.NumberFormat('es-PE', { maximumFractionDigits: 1 });
const cell = 'h-9 w-full rounded-md border bg-background px-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60';

async function call(url: string, init: RequestInit) {
  const response = await fetch(url, { ...init, headers: { 'Content-Type': 'application/json' } });
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error || data?.message || 'No se pudo guardar');
  }
  return response.json().catch(() => null);
}

/**
 * Edita el plan de cuotas de un proyecto en una sola tabla con un único «Guardar».
 * Lo cobrado no se edita aquí: se registra desde el panel de cada cuota.
 */
export function PlanEditor({ projectId, clientId, projectPrice, payments, paidById, milestones, isAdmin }: {
  projectId: string;
  clientId: string;
  projectPrice: number;
  payments: ProjectPayment[];
  paidById: Record<string, number>;
  milestones: Array<{ id: string; title: string; status: string }>;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const active = useMemo(() => payments.filter((payment) => payment.status !== 'CANCELLED'), [payments]);
  const cancelled = payments.filter((payment) => payment.status === 'CANCELLED');
  const currency = active[0]?.currency ?? 'USD';
  const [rows, setRows] = useState<Record<string, Row>>(() => Object.fromEntries(payments.map((p) => [p.id, rowOf(p)])));
  const [drafts, setDrafts] = useState<Row[]>([]);
  const [openNotes, setOpenNotes] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmCancel, setConfirmCancel] = useState<ProjectPayment | null>(null);
  const [showGenerator, setShowGenerator] = useState(active.length === 0);

  const dirtyIds = active.filter((p) => !sameRow(rows[p.id], rowOf(p))).map((p) => p.id);
  const validDrafts = drafts.filter((d) => d.concept.trim() && Number(d.amount) > 0);
  const dirty = dirtyIds.length > 0 || drafts.length > 0;
  const total = active.reduce((sum, p) => sum + Number(rows[p.id].amount || 0), 0) + drafts.reduce((sum, d) => sum + Number(d.amount || 0), 0);
  const gap = projectPrice - total;
  const hasCollections = active.some((p) => (paidById[p.id] ?? 0) > 0 || p.status === 'UNDER_REVIEW');
  const percentOf = (amount: number) => (projectPrice > 0 ? Math.round((amount / projectPrice) * 10000) / 100 : null);

  const update = (id: string, patch: Partial<Row>) => setRows((current) => ({ ...current, [id]: { ...current[id], ...patch } }));
  const updateDraft = (index: number, patch: Partial<Row>) => setDrafts((current) => current.map((d, i) => (i === index ? { ...d, ...patch } : d)));
  const toggleNotes = (id: string) => setOpenNotes((current) => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  const discard = () => { setRows(Object.fromEntries(payments.map((p) => [p.id, rowOf(p)]))); setDrafts([]); setErrors({}); };

  const save = async () => {
    setSaving(true);
    const failed: Record<string, string> = {};
    const body = (row: Row) => ({ concept: row.concept.trim(), amount: Number(row.amount), ...(percentOf(Number(row.amount)) !== null ? { percentage: percentOf(Number(row.amount)) } : {}), currency, dueDate: row.dueDate || null, milestoneId: row.milestoneId || null, notes: row.notes });
    for (const id of dirtyIds) {
      try { await call(`/api/backend/projects/${projectId}/payments/${id}`, { method: 'PATCH', body: JSON.stringify(body(rows[id])) }); }
      catch (error) { failed[id] = error instanceof Error ? error.message : 'No se pudo guardar'; }
    }
    const kept: Row[] = [];
    for (const [index, draft] of drafts.entries()) {
      if (!validDrafts.includes(draft)) { kept.push(draft); failed[`draft-${index}`] = 'Completa concepto y monto'; continue; }
      try {
        const created = await call('/api/backend/payments', { method: 'POST', body: JSON.stringify({ clientId, projectId, concept: draft.concept.trim(), amount: Number(draft.amount), currency, dueDate: draft.dueDate || null }) }) as { id: string } | null;
        // El alta no recibe hito ni porcentaje: se completan con el mismo PATCH del plan.
        if (created?.id) await call(`/api/backend/projects/${projectId}/payments/${created.id}`, { method: 'PATCH', body: JSON.stringify(body(draft)) });
      } catch (error) { kept.push(draft); failed[`draft-${index}`] = error instanceof Error ? error.message : 'No se pudo crear'; }
    }
    setSaving(false);
    setErrors(failed);
    setDrafts(kept);
    // Con errores no se refresca: se conservan las ediciones para corregirlas (volver a guardar es idempotente).
    if (Object.keys(failed).length) toast.error('Algunas cuotas no se guardaron. Revisa los mensajes en rojo.');
    else { toast.success('Plan guardado'); router.refresh(); }
  };

  const setStatus = async (payment: ProjectPayment, status: 'CANCELLED' | 'PENDING') => {
    try {
      await call(`/api/backend/payments/${payment.id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
      toast.success(status === 'CANCELLED' ? 'Cuota cancelada' : 'Cuota reactivada');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo cambiar la cuota');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Precio del proyecto <b className="text-slate-900 tabular-nums">{formatCurrency(projectPrice, currency)}</b></p>
        {!showGenerator && <Button type="button" size="sm" variant="ghost" onClick={() => setShowGenerator(true)}><Wand2 size={14} aria-hidden="true" />Rehacer con un esquema</Button>}
      </div>

      {showGenerator && <SchemeGenerator projectId={projectId} price={projectPrice} replaceable={active.length} blocked={hasCollections} onClose={active.length ? () => setShowGenerator(false) : undefined} />}

      {(active.length > 0 || drafts.length > 0) && (
        <div className="overflow-hidden rounded-xl border">
          <div role="row" className="hidden grid-cols-[1.75rem_minmax(0,1fr)_7.5rem_3.5rem_9.5rem_minmax(9rem,13rem)_4.5rem] gap-3 border-b bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-500 lg:grid">
            <span>#</span><span>Concepto</span><span>Monto ({currency})</span><span className="text-right">%</span><span>Vence el</span><span>Hito</span><span className="sr-only">Acciones</span>
          </div>
          <ol className="divide-y">
            {active.map((payment, index) => {
              const row = rows[payment.id];
              const paid = paidById[payment.id] ?? 0;
              const locked = paid > 0 || payment.status === 'UNDER_REVIEW';
              const changed = dirtyIds.includes(payment.id);
              const pct = percentOf(Number(row.amount || 0));
              return (
                <li key={payment.id} className={`px-4 py-3 ${changed ? 'bg-blue-50/40' : ''}`}>
                  <div className="grid grid-cols-[1.75rem_minmax(0,1fr)_auto] items-center gap-3 lg:grid-cols-[1.75rem_minmax(0,1fr)_7.5rem_3.5rem_9.5rem_minmax(9rem,13rem)_4.5rem]">
                    <span className="text-xs font-semibold text-muted-foreground tabular-nums">{index + 1}</span>
                    <input aria-label={`Concepto de la cuota ${index + 1}`} value={row.concept} onChange={(e) => update(payment.id, { concept: e.target.value })} className={cell} />
                    <div className="col-span-3 col-start-2 grid grid-cols-[1fr_3.5rem_1fr] items-center gap-3 lg:contents">
                      <label className="relative block">
                        <span className="sr-only">Monto de la cuota {index + 1}</span>
                        <input type="number" min={locked ? paid : 0} step="0.01" inputMode="decimal" value={row.amount} onChange={(e) => update(payment.id, { amount: e.target.value })} className={`${cell} tabular-nums ${locked ? 'pr-7' : ''}`} />
                        {locked && <Lock size={12} aria-hidden="true" className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground" />}
                      </label>
                      <span className="text-right text-sm text-muted-foreground tabular-nums">{pct === null ? '—' : `${pctFormat.format(pct)} %`}</span>
                      <input type="date" aria-label={`Vencimiento de la cuota ${index + 1}`} value={row.dueDate} onChange={(e) => update(payment.id, { dueDate: e.target.value })} className={cell} />
                    </div>
                    <select aria-label={`Hito de la cuota ${index + 1}`} value={row.milestoneId} disabled={locked} onChange={(e) => update(payment.id, { milestoneId: e.target.value })} className={`${cell} col-span-2 col-start-2 lg:col-span-1 lg:col-start-auto`}>
                      <option value="">Sin hito</option>
                      {milestones.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
                    </select>
                    <div className="col-start-3 row-start-1 flex justify-end gap-1 lg:col-start-auto lg:row-start-auto">
                      <Button type="button" size="icon-sm" variant="ghost" aria-pressed={openNotes.has(payment.id)} aria-label={row.notes ? 'Nota interna (tiene nota)' : 'Añadir nota interna'} onClick={() => toggleNotes(payment.id)} className={row.notes ? 'text-blue-700' : 'text-muted-foreground'}><NotebookPen size={15} /></Button>
                      {isAdmin && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button type="button" size="icon-sm" variant="ghost" aria-label={`Más acciones de la cuota ${index + 1}`}><MoreHorizontal size={15} /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem disabled={locked} className="text-destructive" onSelect={() => setConfirmCancel(payment)}>{locked ? 'No se puede cancelar: tiene cobros' : 'Cancelar cuota'}</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                  {locked && <p className="mt-1.5 pl-[calc(1.75rem+0.75rem)] text-xs text-muted-foreground">Cobrado {formatCurrency(paid, payment.currency)}{payment.status === 'UNDER_REVIEW' && ' · comprobante por verificar'} — el monto no puede bajar de ahí y el hito queda fijo.</p>}
                  {openNotes.has(payment.id) && <input aria-label={`Nota interna de la cuota ${index + 1}`} value={row.notes} onChange={(e) => update(payment.id, { notes: e.target.value })} placeholder="Nota interna: solo la ve el equipo" className={`${cell} mt-2 lg:ml-[calc(1.75rem+0.75rem)] lg:w-[calc(100%-2.5rem)]`} />}
                  {errors[payment.id] && <p role="alert" className="mt-1.5 text-xs text-destructive lg:pl-10">{errors[payment.id]}</p>}
                </li>
              );
            })}
            {drafts.map((draft, index) => (
              <li key={`draft-${index}`} className="bg-blue-50/40 px-4 py-3">
                <div className="grid grid-cols-[1.75rem_minmax(0,1fr)_auto] items-center gap-3 lg:grid-cols-[1.75rem_minmax(0,1fr)_7.5rem_3.5rem_9.5rem_minmax(9rem,13rem)_4.5rem]">
                  <span className="text-xs font-semibold text-blue-700">Nueva</span>
                  <input autoFocus aria-label="Concepto de la nueva cuota" placeholder="Ej. Mantenimiento mensual" value={draft.concept} onChange={(e) => updateDraft(index, { concept: e.target.value })} className={cell} />
                  <div className="col-span-3 col-start-2 grid grid-cols-[1fr_3.5rem_1fr] items-center gap-3 lg:contents">
                    <input type="number" min="0.01" step="0.01" inputMode="decimal" aria-label="Monto de la nueva cuota" value={draft.amount} onChange={(e) => updateDraft(index, { amount: e.target.value })} className={`${cell} tabular-nums`} />
                    <span className="text-right text-sm text-muted-foreground tabular-nums">{draft.amount && percentOf(Number(draft.amount)) !== null ? `${pctFormat.format(percentOf(Number(draft.amount))!)} %` : '—'}</span>
                    <input type="date" aria-label="Vencimiento de la nueva cuota" value={draft.dueDate} onChange={(e) => updateDraft(index, { dueDate: e.target.value })} className={cell} />
                  </div>
                  <select aria-label="Hito de la nueva cuota" value={draft.milestoneId} onChange={(e) => updateDraft(index, { milestoneId: e.target.value })} className={`${cell} col-span-2 col-start-2 lg:col-span-1 lg:col-start-auto`}>
                    <option value="">Sin hito</option>
                    {milestones.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
                  </select>
                  <div className="col-start-3 row-start-1 flex justify-end lg:col-start-auto lg:row-start-auto">
                    <Button type="button" size="sm" variant="ghost" onClick={() => setDrafts((current) => current.filter((_, i) => i !== index))}>Quitar</Button>
                  </div>
                </div>
                {errors[`draft-${index}`] && <p role="alert" className="mt-1.5 text-xs text-destructive lg:pl-10">{errors[`draft-${index}`]}</p>}
              </li>
            ))}
          </ol>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t bg-slate-50 px-4 py-3 text-sm">
            <Button type="button" size="sm" variant="ghost" onClick={() => setDrafts((current) => [...current, { concept: '', amount: gap > 0 ? gap.toFixed(2) : '', dueDate: '', milestoneId: '', notes: '' }])}><Plus size={14} aria-hidden="true" />Añadir cuota</Button>
            <p className="tabular-nums">
              Programado <b>{formatCurrency(total, currency)}</b>
              {Math.abs(gap) > 0.005
                ? <span className="ml-2 text-amber-700">{gap > 0 ? `faltan ${formatCurrency(gap, currency)} para el precio` : `${formatCurrency(-gap, currency)} sobre el precio`}</span>
                : <span className="ml-2 text-emerald-700">cuadra con el precio</span>}
            </p>
            <div className="ml-auto flex gap-2">
              {dirty && <Button type="button" size="sm" variant="ghost" disabled={saving} onClick={discard}>Descartar</Button>}
              <Button type="button" size="sm" disabled={!dirty || saving} onClick={save}>{saving ? 'Guardando…' : dirty ? `Guardar cambios (${dirtyIds.length + drafts.length})` : 'Sin cambios'}</Button>
            </div>
          </div>
        </div>
      )}

      {cancelled.length > 0 && (
        <details className="text-sm">
          <summary className="cursor-pointer text-muted-foreground">{cancelled.length === 1 ? '1 cuota cancelada' : `${cancelled.length} cuotas canceladas`}</summary>
          <ul className="mt-2 divide-y rounded-lg border">
            {cancelled.map((payment) => (
              <li key={payment.id} className="flex items-center justify-between gap-3 px-4 py-2">
                <span className="text-slate-700">{payment.concept} · <span className="tabular-nums">{formatCurrency(Number(payment.amount), payment.currency)}</span></span>
                {isAdmin && <Button type="button" size="sm" variant="ghost" onClick={() => setStatus(payment, 'PENDING')}>Reactivar</Button>}
              </li>
            ))}
          </ul>
        </details>
      )}

      <AlertDialog open={confirmCancel !== null} onOpenChange={(open) => { if (!open) setConfirmCancel(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cancelar «{confirmCancel?.concept}»?</AlertDialogTitle>
            <AlertDialogDescription>Deja de aparecer en Cobros y en el portal del cliente. Puedes reactivarla desde «cuotas canceladas».</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Volver</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => { if (confirmCancel) void setStatus(confirmCancel, 'CANCELLED'); setConfirmCancel(null); }}>Cancelar cuota</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SchemeGenerator({ projectId, price, replaceable, blocked, onClose }: { projectId: string; price: number; replaceable: number; blocked: boolean; onClose?: () => void }) {
  const router = useRouter();
  const [preset, setPreset] = useState<string>('SPLIT_50_50');
  const [total, setTotal] = useState(String(price || ''));
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const amount = Number(total);
  const chosen = PRESETS.find((p) => p.id === preset)!;

  const apply = async () => {
    setPending(true);
    try {
      await applyPaymentPresetAction(projectId, preset, amount);
      toast.success('Plan generado');
      onClose?.();
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo generar el plan');
    } finally {
      setPending(false);
      setConfirming(false);
    }
  };

  return (
    <section aria-labelledby="scheme-title" className="rounded-xl border p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 id="scheme-title" className="text-sm font-semibold text-slate-900">{replaceable ? 'Rehacer el plan con un esquema' : 'Arma el plan con un esquema'}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">Crea las cuotas con su porcentaje. Después puedes ajustar conceptos, fechas e hitos.</p>
        </div>
        {onClose && <Button type="button" size="sm" variant="ghost" onClick={onClose}>Cerrar</Button>}
      </div>

      {blocked ? (
        <p className="mt-3 rounded-md bg-amber-50 p-3 text-sm text-amber-900">Este plan ya tiene cobros o un comprobante por verificar. Rehacerlo duplicaría lo cobrado, así que ajusta las cuotas a mano en la tabla.</p>
      ) : (
        <>
          <div role="radiogroup" aria-label="Esquema" className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {PRESETS.map((option) => (
              <button key={option.id} type="button" role="radio" aria-checked={preset === option.id} onClick={() => setPreset(option.id)} className="rounded-lg border p-3 text-left transition hover:bg-slate-50 aria-checked:border-blue-400 aria-checked:bg-blue-50">
                <div className="flex h-2 gap-0.5 overflow-hidden rounded-full" aria-hidden="true">
                  {option.split.map((part, i) => <span key={i} className="h-full bg-blue-500" style={{ flexGrow: part, opacity: 1 - i * 0.25 }} />)}
                </div>
                <p className="mt-2 text-sm font-semibold text-slate-900 tabular-nums">{option.split.join(' / ')}</p>
                <p className="text-xs text-muted-foreground">{option.label}</p>
              </button>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <label className="text-xs font-semibold text-slate-700">Total a repartir (USD)
              <input type="number" min="0.01" step="0.01" inputMode="decimal" value={total} onChange={(e) => setTotal(e.target.value)} className={`${cell} mt-1 w-40 tabular-nums`} />
            </label>
            <p className="pb-2 text-xs text-muted-foreground tabular-nums">{amount > 0 ? chosen.split.map((part) => formatCurrency((amount * part) / 100, 'USD')).join(' + ') : 'Ingresa el total'}</p>
            <Button type="button" className="ml-auto" disabled={!(amount > 0) || pending} onClick={() => (replaceable ? setConfirming(true) : void apply())}>{pending ? 'Generando…' : replaceable ? 'Rehacer plan' : 'Crear cuotas'}</Button>
          </div>
        </>
      )}

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Rehacer el plan como {chosen.split.join(' / ')}?</AlertDialogTitle>
            <AlertDialogDescription>Se borran las {replaceable} cuotas actuales (ninguna tiene cobros) y se crean {chosen.split.length} nuevas por {formatCurrency(amount, 'USD')}. Los cambios que hiciste a conceptos, fechas o hitos se pierden.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Volver</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => void apply()}>Rehacer plan</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
