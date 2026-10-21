'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Copy, Download, Eye, Lock, Plus, Send, Trash2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  LAYERS, PROPOSAL_STATUS, STAGE_OUTCOMES, formatMoney, proposalLabel, proposalTotal,
  shortDate, stagePayments, stagePctSum, taxBreakdown, totalWeeks,
} from '@/src/modules/proposals/format';
import type { ProposalAddon, ProposalDetail, ProposalItem, ProposalLayer, ProposalPatch, ProposalThirdParty } from '@/src/modules/proposals/types';

const STEPS = ['Entendimos', 'Solución', 'Alcance', 'Plan', 'Inversión', 'Opcionales', 'Condiciones'] as const;

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

async function call<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, headers: { 'Content-Type': 'application/json' } });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error((Array.isArray(data?.message) ? data.message.join('. ') : data?.message) || 'No se pudo guardar');
  return data as T;
}

/* Día calendario de Lima ↔ ISO a mediodía, igual que en la hoja del lead. */
const limaKey = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit' });
const toKey = (iso: string | null) => (iso ? limaKey.format(new Date(iso)) : '');
const fromKey = (key: string) => (key ? `${key}T12:00:00-05:00` : null);

const field = 'block w-full rounded-lg border bg-background px-2.5 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-70';
const input = cn(field, 'h-9');

/* Las listas se guardan enteras: sin filas vacías que el servidor rechazaría. */
const itemsBody = (items: ProposalItem[]) => items.map(({ layer, module, description, amount }) => ({ layer, module: module.trim(), description: description?.trim() || null, amount: Number(amount) || 0 }));
const addonsBody = (addons: ProposalAddon[]) => addons.filter((addon) => addon.name.trim()).map(({ name, price, chosen }) => ({ name: name.trim(), price: price === null || price === '' ? null : Number(price) || 0, chosen }));
const thirdPartiesBody = (rows: ProposalThirdParty[]) => rows.filter((row) => row.name.trim()).map(({ name, provider, approxCost }) => ({ name: name.trim(), provider: provider?.trim() || null, approxCost: approxCost?.trim() || null }));

export function ProposalEditor({ initial }: { initial: ProposalDetail }) {
  const router = useRouter();
  const [proposal, setProposal] = useState(initial);
  const [step, setStep] = useState(0);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const queue = useRef<Promise<void>>(Promise.resolve());
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const pending = useRef<Record<string, ProposalPatch>>({});
  const readOnly = proposal.status !== 'DRAFT';

  /** Los guardados salen en orden; la respuesta no pisa lo que se sigue escribiendo. */
  const send = (patch: ProposalPatch) => {
    queue.current = queue.current.then(async () => {
      setSaveState('saving');
      setError(null);
      try {
        const saved = await call<ProposalDetail>(`/api/backend/proposals/${proposal.id}`, { method: 'PATCH', body: JSON.stringify(patch) });
        setProposal((current) => ({ ...current, total: saved.total, updatedAt: saved.updatedAt }));
        setSaveState('saved');
      } catch (err) {
        setSaveState('error');
        setError(err instanceof Error ? err.message : 'No se pudo guardar');
      }
    });
  };

  const update = (changes: Partial<ProposalDetail>, patch: ProposalPatch) => {
    if (readOnly) return;
    setProposal((current) => ({ ...current, ...changes }));
    send(patch);
  };

  /** Para listas que se escriben tecla a tecla: guarda al dejar de escribir. */
  const updateLater = (key: string, changes: Partial<ProposalDetail>, patch: ProposalPatch) => {
    if (readOnly) return;
    setProposal((current) => ({ ...current, ...changes }));
    clearTimeout(timers.current[key]);
    pending.current[key] = patch;
    timers.current[key] = setTimeout(() => {
      delete pending.current[key];
      send(patch);
    }, 700);
  };

  /** Manda lo que quedó esperando y espera a que todo esté guardado (antes del PDF o del envío). */
  const flush = async () => {
    for (const [key, patch] of Object.entries(pending.current)) {
      clearTimeout(timers.current[key]);
      delete pending.current[key];
      send(patch);
    }
    await queue.current;
  };

  useEffect(() => {
    const pending = timers.current;
    return () => Object.values(pending).forEach(clearTimeout);
  }, []);

  const total = useMemo(() => proposalTotal(proposal.items, proposal.addons), [proposal.items, proposal.addons]);
  const tax = taxBreakdown(total, proposal.taxMode);
  const pctSum = stagePctSum(proposal.stages);

  const newVersion = async () => {
    setBusy(true);
    try {
      const copy = await call<ProposalDetail>(`/api/backend/proposals/${proposal.id}/versions`, { method: 'POST' });
      router.push(`/internal/proposals/${copy.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear la versión');
      setSaveState('error');
      setBusy(false);
    }
  };

  const pdfUrl = `/api/backend/proposals/${proposal.id}/pdf`;
  const openPdf = async (inline: boolean) => {
    // La pestaña se abre antes de esperar el guardado: si no, el navegador la bloquea.
    const tab = inline ? window.open('about:blank', '_blank') : null;
    await flush();
    const url = inline ? `${pdfUrl}?inline=1` : pdfUrl;
    if (tab) tab.location.href = url;
    else window.location.href = url;
  };

  const markSent = async () => {
    setBusy(true);
    try {
      await flush();
      const sent = await call<ProposalDetail>(`/api/backend/proposals/${proposal.id}/send`, { method: 'POST' });
      setProposal(sent);
      setSaveState('idle');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo enviar');
      setSaveState('error');
    } finally {
      setBusy(false);
    }
  };

  const markRejected = async (reason: string) => {
    setBusy(true);
    try {
      const rejected = await call<ProposalDetail>(`/api/backend/proposals/${proposal.id}/reject`, { method: 'POST', body: JSON.stringify({ reason: reason.trim() || null }) });
      setProposal(rejected);
      setSaveState('idle');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar');
      setSaveState('error');
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await call(`/api/backend/proposals/${proposal.id}`, { method: 'DELETE' });
      router.push(`/internal/leads?lead=${proposal.leadId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar');
      setSaveState('error');
      setBusy(false);
    }
  };

  const business = proposal.lead.companyName || proposal.lead.name;
  const status = PROPOSAL_STATUS[proposal.status];
  const newerVersion = proposal.children[0];
  // Lo mismo que valida el servidor al enviar.
  const sendBlocker = !proposal.items.some((item) => item.module.trim())
    ? 'Agrega al menos un módulo al alcance.'
    : total <= 0
      ? 'La propuesta no tiene precio.'
      : pctSum !== 100
        ? `Las cuotas suman ${pctSum} %: deben sumar 100 %.`
        : null;

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
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Para {business}
            {proposal.preparedBy ? ` · preparada por ${proposal.preparedBy.name}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <SaveStatus state={saveState} error={error} />
          {!readOnly && (
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
                  <AlertDialogDescription>Se borra todo lo que escribiste en esta versión. No se puede deshacer.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={remove}>Eliminar</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {readOnly && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-3.5 text-sm">
          <p className="flex items-center gap-2">
            <Lock className="size-4 text-muted-foreground" aria-hidden="true" />
            {newerVersion
              ? `Esta versión ya no es la vigente: hay una v${newerVersion.version}.`
              : proposal.status === 'REJECTED'
                ? `Rechazada${proposal.rejectedAt ? ` el ${shortDate(proposal.rejectedAt)}` : ''}${proposal.rejectionReason ? `: ${proposal.rejectionReason}` : '.'} Puedes seguir con una versión nueva.`
                : proposal.status === 'EXPIRED'
                  ? 'Venció sin respuesta. Crea una versión nueva con fechas al día o márcala como rechazada.'
                  : `Enviada${proposal.sentAt ? ` el ${shortDate(proposal.sentAt)}` : ''}. Así la recibió el cliente: para cambiarla se crea una versión nueva y esta queda como estaba.`}
          </p>
          {newerVersion ? (
            <Button asChild variant="outline" size="sm">
              <Link href={`/internal/proposals/${newerVersion.id}`}>Ir a la v{newerVersion.version}</Link>
            </Button>
          ) : (
            proposal.status !== 'ACCEPTED' && (
              <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={newVersion} disabled={busy}>
                <Copy className="size-4" aria-hidden="true" />
                Editar (crea v{proposal.version + 1})
              </Button>
            )
          )}
        </div>
      )}

      <nav aria-label="Pasos de la propuesta" className="-mx-1 overflow-x-auto px-1 [scrollbar-width:none]">
        <ol className="flex min-w-max gap-1.5">
          {STEPS.map((label, index) => (
            <li key={label}>
              <button
                type="button"
                onClick={() => setStep(index)}
                aria-current={step === index ? 'step' : undefined}
                className={cn(
                  'flex items-center gap-2 rounded-full border px-3 py-1.5 text-[13px] font-semibold text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  step === index && 'border-foreground/40 bg-muted text-foreground',
                )}
              >
                <span className="grid size-5 place-items-center rounded-full bg-background text-[11px] tabular-nums">{index + 1}</span>
                {label}
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 rounded-2xl border bg-card p-5 sm:p-6">
          <fieldset disabled={readOnly} className="min-w-0 space-y-6">
            {step === 0 && <UnderstandingStep proposal={proposal} update={update} />}
            {step === 1 && <SolutionStep proposal={proposal} update={update} />}
            {step === 2 && <ScopeStep proposal={proposal} update={update} updateLater={updateLater} />}
            {step === 3 && <PlanStep proposal={proposal} updateLater={updateLater} />}
            {step === 4 && <InvestmentStep proposal={proposal} update={update} updateLater={updateLater} amountDue={tax.total} />}
            {step === 5 && <AddonsStep proposal={proposal} update={update} updateLater={updateLater} />}
            {step === 6 && <ConditionsStep proposal={proposal} update={update} />}
          </fieldset>
          <div className="mt-8 flex items-center justify-between gap-2 border-t pt-4">
            <Button type="button" variant="ghost" size="sm" className="gap-1.5" onClick={() => setStep(step - 1)} disabled={step === 0}>
              <ArrowLeft className="size-4" aria-hidden="true" />
              Anterior
            </Button>
            {step < STEPS.length - 1 ? (
              <Button type="button" size="sm" className="gap-1.5" onClick={() => setStep(step + 1)}>
                {STEPS[step + 1]}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
            ) : (
              <Button asChild size="sm">
                <Link href={`/internal/leads?lead=${proposal.leadId}`}>Volver al lead</Link>
              </Button>
            )}
          </div>
        </div>

        <aside className="h-fit space-y-4 rounded-2xl border bg-card p-5 lg:sticky lg:top-6" aria-label="Resumen de la propuesta">
          <div>
            <p className="text-xs font-semibold text-muted-foreground">Total</p>
            <p className="text-2xl font-semibold tabular-nums">{formatMoney(total, proposal.currency)}</p>
            <p className="text-xs text-muted-foreground">{proposal.taxMode === 'PLUS_IGV' ? `+ IGV ${formatMoney(tax.igv, proposal.currency)} · a pagar ${formatMoney(tax.total, proposal.currency)}` : `IGV incluido (${formatMoney(tax.igv, proposal.currency)})`}</p>
          </div>
          <dl className="space-y-2 border-t pt-4 text-[13px]">
            <SummaryRow label="Módulos">{proposal.items.length}</SummaryRow>
            <SummaryRow label="Opcionales elegidos">{proposal.addons.filter((addon) => addon.chosen).length}</SummaryRow>
            <SummaryRow label="Plazo">{totalWeeks(proposal.stages)} semanas</SummaryRow>
            <SummaryRow label="Cuotas">
              <span className={cn(pctSum !== 100 && 'text-amber-400')}>
                {proposal.stages.filter((stage) => stage.paymentPct > 0).map((stage) => `${stage.paymentPct}`).join(' / ')} %
              </span>
            </SummaryRow>
            <SummaryRow label="Válida hasta">{proposal.validUntil ? shortDate(proposal.validUntil) : '—'}</SummaryRow>
          </dl>
          {pctSum !== 100 && <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-2.5 text-xs text-amber-400">Las cuotas suman {pctSum} %: deben sumar 100 % antes de enviarla.</p>}
          <div className="space-y-2 border-t pt-4">
            <div className="grid grid-cols-2 gap-2">
              <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => openPdf(false)} disabled={busy}>
                <Download className="size-4" aria-hidden="true" />
                PDF
              </Button>
              <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => openPdf(true)} disabled={busy}>
                <Eye className="size-4" aria-hidden="true" />
                Vista previa
              </Button>
            </div>
            {proposal.status === 'DRAFT' && (
              <>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button type="button" size="sm" className="w-full gap-1.5" disabled={busy || Boolean(sendBlocker)}>
                      <Send className="size-4" aria-hidden="true" />
                      Marcar enviada
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Marcar {proposalLabel(proposal)} como enviada?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Se guarda el PDF tal como está hoy y ya no se puede editar: los cambios irán en una versión nueva. El lead pasa a «Cotizado» y se agenda un seguimiento en 3 días.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={markSent}>Marcar enviada</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <p className="text-xs text-muted-foreground">{sendBlocker ?? 'Descarga el PDF, mándalo al cliente y luego márcala como enviada.'}</p>
              </>
            )}
            {(proposal.status === 'SENT' || proposal.status === 'EXPIRED') && !newerVersion && <RejectDialog busy={busy} onConfirm={markRejected} />}
          </div>
        </aside>
      </div>
    </section>
  );
}

type Update = (changes: Partial<ProposalDetail>, patch: ProposalPatch) => void;
type UpdateLater = (key: string, changes: Partial<ProposalDetail>, patch: ProposalPatch) => void;

/* ---------- Pasos ---------- */

function StepHeader({ page, title, children }: { page: string; title: string; children?: ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.07em] text-muted-foreground">Pág. {page}</p>
      <h2 className="mt-1 text-xl font-semibold">{title}</h2>
      {children && <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{children}</p>}
    </div>
  );
}

function UnderstandingStep({ proposal, update }: { proposal: ProposalDetail; update: Update }) {
  return (
    <>
      <StepHeader page="02" title="Lo que entendimos">
        Lo que el cliente nos contó, con sus palabras. Si algo aquí está mal, todo lo demás también.
      </StepHeader>
      <Field label="Fecha de la reunión" hint="sale como «Basado en la reunión del…»">
        <input type="date" className={cn(input, 'max-w-48')} value={toKey(proposal.meetingDate)} onChange={(event) => update({ meetingDate: fromKey(event.target.value) }, { meetingDate: fromKey(event.target.value) })} />
      </Field>
      <TextField label="01 · Cómo funciona hoy" placeholder="El proceso actual y las herramientas que usan." value={proposal.understandingToday} onSave={(value) => update({ understandingToday: value }, { understandingToday: value })} />
      <TextField label="02 · Qué está costando" placeholder="El problema concreto: tiempo, errores, ventas perdidas o dependencia de una persona." value={proposal.understandingCost} onSave={(value) => update({ understandingCost: value }, { understandingCost: value })} />
      <TextField label="03 · Cómo se ve el éxito" placeholder="Qué tiene que ser verdad cuando el sistema esté funcionando." value={proposal.understandingSuccess} onSave={(value) => update({ understandingSuccess: value }, { understandingSuccess: value })} />
    </>
  );
}

function SolutionStep({ proposal, update }: { proposal: ProposalDetail; update: Update }) {
  const toggle = (layer: ProposalLayer) => {
    const layers = proposal.layers.includes(layer) ? proposal.layers.filter((value) => value !== layer) : LAYERS.map((option) => option.id).filter((id) => id === layer || proposal.layers.includes(id));
    update({ layers }, { layers });
  };
  return (
    <>
      <StepHeader page="03" title="La solución">
        Qué proponemos construir y con qué capas.
      </StepHeader>
      <TextInput label="Nombre del proyecto" hint="pasa al proyecto al convertir" value={proposal.title} required onSave={(value) => value && update({ title: value }, { title: value })} />
      <TextField label="En una frase" rows={2} maxLength={600} placeholder="Un sistema de reservas en línea con tablero para recepción y pagos con tarjeta." value={proposal.solutionSummary} onSave={(value) => update({ solutionSummary: value }, { solutionSummary: value })} />
      <div>
        <p className="mb-2 text-sm font-semibold">Capas incluidas</p>
        <div className="grid gap-2 sm:grid-cols-3">
          {LAYERS.map((layer) => {
            const on = proposal.layers.includes(layer.id);
            return (
              <button
                key={layer.id}
                type="button"
                role="checkbox"
                aria-checked={on}
                onClick={() => toggle(layer.id)}
                className={cn('rounded-xl border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed', on ? 'border-primary/60 bg-primary/10' : 'hover:border-foreground/30')}
              >
                <span className="flex items-center justify-between text-sm font-semibold">
                  {layer.label}
                  <span className={cn('grid size-4 place-items-center rounded border text-[10px]', on && 'border-primary bg-primary text-primary-foreground')} aria-hidden="true">
                    {on ? '✓' : ''}
                  </span>
                </span>
                <span className="mt-1 block text-xs text-muted-foreground">{layer.description}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

function ScopeStep({ proposal, update, updateLater }: { proposal: ProposalDetail; update: Update; updateLater: UpdateLater }) {
  const layers = proposal.layers.length ? proposal.layers : LAYERS.map((layer) => layer.id);
  const setItems = (items: ProposalItem[], now = false) => (now ? update : (changes: Partial<ProposalDetail>, patch: ProposalPatch) => updateLater('items', changes, patch))({ items }, { items: itemsBody(items) });
  const change = (index: number, changes: Partial<ProposalItem>, now = false) => setItems(proposal.items.map((item, position) => (position === index ? { ...item, ...changes } : item)), now);
  const add = () => setItems([...proposal.items, { layer: layers[0], module: '', description: null, amount: 0 }], true);
  const remove = (index: number) => setItems(proposal.items.filter((_, position) => position !== index), true);

  return (
    <>
      <StepHeader page="04" title="Alcance, módulo por módulo">
        Lo que esté aquí se construye. El monto de cada módulo es interno: en el PDF solo sale el total, salvo que actives «mostrar desglose» en Inversión.
      </StepHeader>
      <div className="space-y-2">
        <div className="hidden grid-cols-[110px_minmax(0,1fr)_minmax(0,1.4fr)_120px_36px] gap-2 px-1 text-xs font-semibold text-muted-foreground md:grid">
          <span>Capa</span>
          <span>Módulo</span>
          <span>Qué podrá hacer el equipo</span>
          <span className="text-right">Monto</span>
          <span />
        </div>
        {proposal.items.map((item, index) => (
          <div key={item.id ?? `new-${index}`} className="grid grid-cols-[110px_minmax(0,1fr)_36px] gap-2 rounded-xl border p-2 md:grid-cols-[110px_minmax(0,1fr)_minmax(0,1.4fr)_120px_36px] md:border-0 md:p-0">
            <select aria-label="Capa" className={input} value={item.layer} onChange={(event) => change(index, { layer: event.target.value as ProposalLayer }, true)}>
              {LAYERS.filter((layer) => layers.includes(layer.id) || layer.id === item.layer).map((layer) => (
                <option key={layer.id} value={layer.id}>
                  {layer.short}
                </option>
              ))}
            </select>
            <input aria-label="Módulo" className={input} placeholder="Tablero de reservas" maxLength={120} value={item.module} onChange={(event) => change(index, { module: event.target.value })} />
            <IconButton label={`Quitar ${item.module || 'módulo'}`} onClick={() => remove(index)} className="md:order-last">
              <X className="size-4" />
            </IconButton>
            <input aria-label="Qué podrá hacer el equipo" className={cn(input, 'col-span-2 md:col-span-1')} placeholder="Ver ocupación del día y mover reservas" maxLength={1000} value={item.description ?? ''} onChange={(event) => change(index, { description: event.target.value })} />
            <MoneyInput label="Monto" currency={proposal.currency} value={item.amount} onChange={(amount) => change(index, { amount })} />
          </div>
        ))}
        {proposal.items.length === 0 && <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">Sin módulos todavía. Agrega uno por cada cosa que el equipo del cliente podrá hacer.</p>}
        <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={add}>
          <Plus className="size-4" aria-hidden="true" />
          Agregar módulo
        </Button>
      </div>
      <TextField label="Fuera del alcance" hint="una línea por punto" placeholder={'App móvil\nFacturación electrónica'} value={proposal.exclusions} onSave={(value) => update({ exclusions: value }, { exclusions: value })} />
    </>
  );
}

function PlanStep({ proposal, updateLater }: { proposal: ProposalDetail; updateLater: UpdateLater }) {
  const weeks = totalWeeks(proposal.stages);
  const setWeeks = (order: number, value: number) => {
    const stages = proposal.stages.map((stage) => (stage.order === order ? { ...stage, weeks: value } : stage));
    updateLater('stages', { stages }, { stages: stages.map(({ order, weeks, paymentPct }) => ({ order, weeks, paymentPct })) });
  };
  const starts = proposal.stages.map((_, index) => totalWeeks(proposal.stages.slice(0, index)));
  return (
    <>
      <StepHeader page="05" title={`${weeks} semanas, cuatro etapas`}>
        Cada etapa termina en algo que el cliente puede ver y aprobar. Las semanas se vuelven las fechas de los hitos al convertir.
      </StepHeader>
      <div className="space-y-3">
        {proposal.stages.map((stage, index) => {
          const start = starts[index];
          return (
            <div key={stage.order} className="grid grid-cols-[minmax(0,1fr)_96px] items-center gap-x-3 gap-y-2 sm:grid-cols-[180px_minmax(0,1fr)_96px]">
              <div>
                <p className="text-sm font-semibold">
                  <span className="tabular-nums text-muted-foreground">0{stage.order}</span> {stage.title}
                </p>
                <p className="text-xs text-muted-foreground">{STAGE_OUTCOMES[stage.order]}</p>
              </div>
              <div className="relative order-last col-span-2 h-2.5 rounded-full bg-muted sm:order-none sm:col-span-1" aria-hidden="true">
                <span className="absolute inset-y-0 rounded-full bg-primary" style={{ left: `${(start / Math.max(weeks, 1)) * 100}%`, width: `${(stage.weeks / Math.max(weeks, 1)) * 100}%` }} />
              </div>
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <input type="number" min={1} max={52} inputMode="numeric" className={cn(input, 'w-16 text-right tabular-nums')} value={stage.weeks} onChange={(event) => setWeeks(stage.order, Math.min(52, Math.max(1, Number(event.target.value) || 1)))} aria-label={`Semanas de ${stage.title}`} />
                sem.
              </label>
            </div>
          );
        })}
      </div>
    </>
  );
}

function InvestmentStep({ proposal, update, updateLater, amountDue }: { proposal: ProposalDetail; update: Update; updateLater: UpdateLater; amountDue: number }) {
  const pctSum = stagePctSum(proposal.stages);
  const payments = stagePayments(proposal.stages, amountDue);
  const setPct = (order: number, value: number) => {
    const stages = proposal.stages.map((stage) => (stage.order === order ? { ...stage, paymentPct: value } : stage));
    updateLater('stages', { stages }, { stages: stages.map(({ order, weeks, paymentPct }) => ({ order, weeks, paymentPct })) });
  };
  const byLayer = LAYERS.map((layer) => ({ ...layer, amount: proposal.items.filter((item) => item.layer === layer.id).reduce((sum, item) => sum + (Number(item.amount) || 0), 0) })).filter((layer) => layer.amount > 0);

  return (
    <>
      <StepHeader page="06" title="Inversión">
        Precio cerrado: la suma de los módulos y de los opcionales elegidos.
      </StepHeader>
      <div className="grid gap-4 sm:grid-cols-2">
        <Segmented label="Moneda" value={proposal.currency} options={[{ value: 'PEN', label: 'Soles' }, { value: 'USD', label: 'Dólares' }]} onChange={(currency) => update({ currency: currency as 'PEN' | 'USD' }, { currency: currency as 'PEN' | 'USD' })} />
        <Segmented label="IGV" value={proposal.taxMode} options={[{ value: 'PLUS_IGV', label: 'Más IGV' }, { value: 'IGV_INCLUDED', label: 'IGV incluido' }]} onChange={(taxMode) => update({ taxMode: taxMode as ProposalDetail['taxMode'] }, { taxMode: taxMode as ProposalDetail['taxMode'] })} />
      </div>
      {byLayer.length > 0 && (
        <div className="rounded-xl border p-3.5 text-sm">
          <p className="mb-2 text-xs font-semibold text-muted-foreground">Por capa</p>
          <ul className="space-y-1">
            {byLayer.map((layer) => (
              <li key={layer.id} className="flex justify-between gap-2">
                {layer.label}
                <span className="tabular-nums">{formatMoney(layer.amount, proposal.currency)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <label className="flex items-start gap-2.5 text-sm">
        <input type="checkbox" className="mt-0.5 size-4 accent-[var(--primary)]" checked={proposal.showBreakdown} onChange={(event) => update({ showBreakdown: event.target.checked }, { showBreakdown: event.target.checked })} />
        <span>
          <span className="font-semibold">Mostrar desglose por módulo en el PDF</span>
          <span className="block text-xs text-muted-foreground">Apagado, el cliente solo ve el total.</span>
        </span>
      </label>
      <div>
        <div className="mb-2 flex items-baseline justify-between gap-2">
          <p className="text-sm font-semibold">Cuotas por etapa</p>
          <p className={cn('text-xs tabular-nums', pctSum === 100 ? 'text-muted-foreground' : 'font-semibold text-amber-400')}>Suman {pctSum} %</p>
        </div>
        <ul className="divide-y rounded-xl border">
          {proposal.stages.map((stage) => {
            const payment = payments.find((row) => row.order === stage.order);
            return (
              <li key={stage.order} className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-sm">
                <span className="min-w-0">
                  <span className="font-semibold">{stage.order === 1 ? 'Al aceptar' : `Al cerrar ${stage.title.toLowerCase()}`}</span>
                  <span className="block text-xs text-muted-foreground">{stage.order === 1 ? 'Con la firma del contrato' : STAGE_OUTCOMES[stage.order]}</span>
                </span>
                <span className="flex items-center gap-3">
                  <span className="w-24 text-right text-xs tabular-nums text-muted-foreground">{payment ? formatMoney(payment.amount, proposal.currency) : '—'}</span>
                  <label className="flex items-center gap-1 text-xs text-muted-foreground">
                    <input type="number" min={0} max={100} inputMode="numeric" className={cn(input, 'w-16 text-right tabular-nums')} value={stage.paymentPct} onChange={(event) => setPct(stage.order, Math.min(100, Math.max(0, Number(event.target.value) || 0)))} aria-label={`Porcentaje al cerrar ${stage.title}`} />
                    %
                  </label>
                </span>
              </li>
            );
          })}
        </ul>
        <p className="mt-2 text-xs text-muted-foreground">Montos sobre lo que se paga{proposal.taxMode === 'PLUS_IGV' ? ' con IGV' : ''}. Al convertir se vuelven las cuotas del proyecto.</p>
      </div>
    </>
  );
}

function AddonsStep({ proposal, update, updateLater }: { proposal: ProposalDetail; update: Update; updateLater: UpdateLater }) {
  const setAddons = (addons: ProposalAddon[], now = false) => (now ? update : (changes: Partial<ProposalDetail>, patch: ProposalPatch) => updateLater('addons', changes, patch))({ addons }, { addons: addonsBody(addons) });
  const changeAddon = (index: number, changes: Partial<ProposalAddon>, now = false) => setAddons(proposal.addons.map((addon, position) => (position === index ? { ...addon, ...changes } : addon)), now);
  const setRows = (thirdParties: ProposalThirdParty[], now = false) => (now ? update : (changes: Partial<ProposalDetail>, patch: ProposalPatch) => updateLater('thirdParties', changes, patch))({ thirdParties }, { thirdParties: thirdPartiesBody(thirdParties) });
  const changeRow = (index: number, changes: Partial<ProposalThirdParty>) => setRows(proposal.thirdParties.map((row, position) => (position === index ? { ...row, ...changes } : row)));

  return (
    <>
      <StepHeader page="07" title="Opcionales">
        Módulos fuera del precio base. Los elegidos suman al alcance y al total; los demás salen como «puedes sumarlo después».
      </StepHeader>
      <ul className="space-y-2">
        {proposal.addons.map((addon, index) => (
          <li key={addon.id ?? `new-${index}`} className="grid grid-cols-[24px_minmax(0,1fr)_120px_36px] items-center gap-2">
            <input type="checkbox" className="size-4 accent-[var(--primary)]" aria-label={`Incluir ${addon.name || 'opcional'}`} checked={addon.chosen} onChange={(event) => changeAddon(index, { chosen: event.target.checked }, true)} />
            <input aria-label="Opcional" className={input} maxLength={120} value={addon.name} onChange={(event) => changeAddon(index, { name: event.target.value })} />
            <MoneyInput label={`Precio de ${addon.name || 'opcional'}`} currency={proposal.currency} value={addon.price ?? ''} placeholder="A cotizar" onChange={(price) => changeAddon(index, { price: price === '' ? null : price })} />
            <IconButton label={`Quitar ${addon.name || 'opcional'}`} onClick={() => setAddons(proposal.addons.filter((_, position) => position !== index), true)}>
              <X className="size-4" />
            </IconButton>
          </li>
        ))}
      </ul>
      <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => setAddons([...proposal.addons, { name: 'Nuevo opcional', price: null, chosen: false }], true)}>
        <Plus className="size-4" aria-hidden="true" />
        Agregar opcional
      </Button>

      <div className="border-t pt-6">
        <p className="text-sm font-semibold">Servicios de terceros</p>
        <p className="mb-3 text-xs text-muted-foreground">A nombre de la empresa del cliente; los paga directo al proveedor.</p>
        <div className="space-y-2">
          {proposal.thirdParties.map((row, index) => (
            <div key={row.id ?? `new-${index}`} className="grid grid-cols-[minmax(0,1fr)_36px] gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_130px_36px]">
              <input aria-label="Servicio" className={input} maxLength={120} value={row.name} onChange={(event) => changeRow(index, { name: event.target.value })} />
              <IconButton label={`Quitar ${row.name || 'servicio'}`} onClick={() => setRows(proposal.thirdParties.filter((_, position) => position !== index), true)} className="sm:order-last">
                <X className="size-4" />
              </IconButton>
              <input aria-label="Proveedor" className={input} placeholder="Proveedor" maxLength={120} value={row.provider ?? ''} onChange={(event) => changeRow(index, { provider: event.target.value })} />
              <input aria-label="Costo aproximado" className={input} placeholder="S/ 60 al año" maxLength={60} value={row.approxCost ?? ''} onChange={(event) => changeRow(index, { approxCost: event.target.value })} />
            </div>
          ))}
        </div>
        <Button type="button" variant="outline" size="sm" className="mt-2 gap-1.5" onClick={() => setRows([...proposal.thirdParties, { name: 'Nuevo servicio', provider: null, approxCost: null }], true)}>
          <Plus className="size-4" aria-hidden="true" />
          Agregar servicio
        </Button>
      </div>
    </>
  );
}

function ConditionsStep({ proposal, update }: { proposal: ProposalDetail; update: Update }) {
  return (
    <>
      <StepHeader page="09" title="Condiciones">
        Validez, fechas y ajustes salen fijos del documento. Aquí va lo que cambia por cliente.
      </StepHeader>
      <Field label="Válida hasta" hint="por defecto, 15 días desde que se creó">
        <input type="date" className={cn(input, 'max-w-48')} value={toKey(proposal.validUntil)} onChange={(event) => update({ validUntil: fromKey(event.target.value) }, { validUntil: fromKey(event.target.value) })} />
      </Field>
      <TextField label="Supuestos" hint="una línea por punto" placeholder={'El cliente entrega logos y textos antes de la semana 3\nUn solo idioma (español)'} value={proposal.assumptions} onSave={(value) => update({ assumptions: value }, { assumptions: value })} />
    </>
  );
}

/* ---------- Piezas ---------- */

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex flex-wrap items-baseline gap-x-2 text-sm font-semibold">
        {label}
        {hint && <span className="text-xs font-normal text-muted-foreground">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

/** Texto largo que se guarda al salir del campo. */
function TextField({ label, hint, placeholder, value, onSave, rows = 4, maxLength = 2000 }: { label: string; hint?: string; placeholder?: string; value: string | null; onSave: (value: string | null) => void; rows?: number; maxLength?: number }) {
  const [draft, setDraft] = useState(value ?? '');
  return (
    <Field label={label} hint={hint}>
      <textarea
        rows={rows}
        maxLength={maxLength}
        placeholder={placeholder}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() => draft.trim() !== (value ?? '') && onSave(draft.trim() || null)}
        className={cn(field, 'resize-y py-2 leading-relaxed')}
      />
    </Field>
  );
}

function TextInput({ label, hint, value, onSave, required }: { label: string; hint?: string; value: string; onSave: (value: string) => void; required?: boolean }) {
  const [draft, setDraft] = useState(value);
  return (
    <Field label={label} hint={hint}>
      <input
        className={input}
        value={draft}
        maxLength={160}
        required={required}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() => {
          const next = draft.trim();
          if (!next && required) return setDraft(value);
          if (next !== value) onSave(next);
        }}
        onKeyDown={(event) => event.key === 'Enter' && event.currentTarget.blur()}
      />
    </Field>
  );
}

function MoneyInput({ label, currency, value, placeholder, onChange }: { label: string; currency: string; value: string | number; placeholder?: string; onChange: (value: string) => void }) {
  return (
    <span className="relative block">
      <span className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-xs text-muted-foreground" aria-hidden="true">
        {currency === 'USD' ? 'US$' : 'S/'}
      </span>
      <input type="number" min={0} step="0.01" inputMode="decimal" aria-label={label} placeholder={placeholder} className={cn(input, 'pl-9 text-right tabular-nums')} value={value === null ? '' : String(value)} onChange={(event) => onChange(event.target.value)} />
    </span>
  );
}

function IconButton({ label, onClick, className, children }: { label: string; onClick: () => void; className?: string; children: ReactNode }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} className={cn('grid size-9 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40', className)}>
      {children}
    </button>
  );
}

function Segmented({ label, value, options, onChange }: { label: string; value: string; options: { value: string; label: string }[]; onChange: (value: string) => void }) {
  return (
    <div role="radiogroup" aria-label={label}>
      <p className="mb-1.5 text-sm font-semibold">{label}</p>
      <div className="inline-flex rounded-lg border bg-background p-0.5">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={value === option.value}
            onClick={() => value !== option.value && onChange(option.value)}
            className={cn('rounded-md px-3 py-1.5 text-[13px] font-semibold text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring', value === option.value && 'bg-muted text-foreground')}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function RejectDialog({ busy, onConfirm }: { busy: boolean; onConfirm: (reason: string) => void }) {
  const [reason, setReason] = useState('');
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button type="button" variant="ghost" size="sm" className="w-full text-muted-foreground" disabled={busy}>
          El cliente la rechazó
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Registrar que la rechazó</AlertDialogTitle>
          <AlertDialogDescription>Queda en el historial del lead. Si luego quieres reintentar, crea una versión nueva.</AlertDialogDescription>
        </AlertDialogHeader>
        <label className="block text-[13px] font-medium">
          Motivo <span className="font-normal text-muted-foreground">(opcional)</span>
          <textarea rows={3} maxLength={500} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Precio, plazo, se fue con otro proveedor…" className={cn(field, 'mt-1.5 resize-y py-2')} />
        </label>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={() => onConfirm(reason)}>Registrar</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function SummaryRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-semibold tabular-nums">{children}</dd>
    </div>
  );
}

function SaveStatus({ state, error }: { state: SaveState; error: string | null }) {
  return (
    <span role="status" aria-live="polite" className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
      {state === 'saving' && 'Guardando…'}
      {state === 'saved' && (
        <>
          <span className="size-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
          Guardado
        </>
      )}
      {state === 'error' && <span className="max-w-64 truncate text-rose-400" title={error ?? undefined}>{error ?? 'No se pudo guardar'}</span>}
    </span>
  );
}

