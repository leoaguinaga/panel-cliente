'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ExternalLink, Paperclip } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { PAYMENT_CHANNELS_LIST, formatPaymentChannelName } from '@/src/modules/payments/channels';
import type { AgendaPayment, PaymentAgenda, PaymentHistory } from '@/src/modules/payments/server/queries';
import { normalizePhone, renderReminder, whatsappUrl } from '@/src/modules/payments/reminder';
import { formatShortDate, whenLabel } from './agenda-format';

export type DrawerTab = 'register' | 'verify' | 'remind' | 'history';
export type ReminderSettings = PaymentAgenda['reminder'];

const field = 'mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring';
const OPEN_STATUSES = new Set(['PENDING', 'PARTIAL', 'OVERDUE']);

/** Las pestañas que tiene sentido mostrar para esta cuota y este usuario. */
export function tabsFor(payment: Pick<AgendaPayment, 'status'>, isAdmin: boolean): DrawerTab[] {
  if (payment.status === 'UNDER_REVIEW') return isAdmin ? ['verify', 'history'] : ['history'];
  if (OPEN_STATUSES.has(payment.status)) return isAdmin ? ['register', 'remind', 'history'] : ['remind', 'history'];
  return ['history'];
}

const TAB_LABELS: Record<DrawerTab, string> = { register: 'Registrar pago', verify: 'Verificar', remind: 'Recordar', history: 'Historial' };

async function send(url: string, init: RequestInit, fallback: string) {
  const response = await fetch(url, init);
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error || data?.message || fallback);
  }
}

async function fetchHistory(id: string): Promise<PaymentHistory> {
  const response = await fetch(`/api/backend/payments/${id}/history`);
  if (!response.ok) throw new Error('history');
  return response.json();
}

export function PaymentDrawer({ payment, initialTab, today, isAdmin, reminder, onClose }: { payment: AgendaPayment; initialTab: DrawerTab; today: string; isAdmin: boolean; reminder: ReminderSettings; onClose: () => void }) {
  const router = useRouter();
  const [tab, setTab] = useState<DrawerTab>(initialTab);
  const [history, setHistory] = useState<PaymentHistory | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const [reload, setReload] = useState(0);

  // El padre monta un panel nuevo (key) por cuota; `reload` vuelve a pedir el historial tras anular un abono.
  const paymentId = payment.id;
  useEffect(() => {
    let alive = true;
    fetchHistory(paymentId).then(
      (data) => { if (alive) { setHistory(data); setHistoryError(null); } },
      () => { if (alive) setHistoryError('No pudimos cargar el historial.'); },
    );
    return () => { alive = false; };
  }, [paymentId, reload]);

  const tabs = tabsFor(payment, isAdmin);
  const balance = payment.amount - payment.paidAmount;
  const client = payment.client.businessName || payment.client.name;
  const done = (message: string) => { toast.success(message); router.refresh(); onClose(); };

  return (
    <Sheet open onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent side="right" className="overflow-y-auto sm:max-w-md">
        <SheetHeader className="space-y-1 pr-8">
          <p className="text-xs text-muted-foreground">{[client, payment.project?.name].filter(Boolean).join(' · ')}</p>
          <SheetTitle className="text-lg">{payment.concept}</SheetTitle>
          <SheetDescription className="sr-only">Detalle de la cuota, registro de pagos e historial.</SheetDescription>
        </SheetHeader>

        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
          <dt className="text-muted-foreground">Monto</dt>
          <dd className="font-semibold tabular-nums">{formatCurrency(payment.amount, payment.currency)}</dd>
          {payment.paidAmount > 0 && payment.status !== 'PAID' && (<>
            <dt className="text-muted-foreground">Cobrado</dt>
            <dd className="tabular-nums">{formatCurrency(payment.paidAmount, payment.currency)} · falta <b>{formatCurrency(balance, payment.currency)}</b></dd>
          </>)}
          <dt className="text-muted-foreground">{payment.group === 'paid' ? 'Estado' : 'Vence'}</dt>
          <dd className={payment.group === 'overdue' ? 'font-semibold text-rose-700' : ''}>
            {payment.dueDate && payment.group === 'overdue' ? `${formatShortDate(payment.dueDate)} · ` : ''}{whenLabel(payment, today)}
          </dd>
          {payment.milestone && (<>
            <dt className="text-muted-foreground">Hito</dt>
            <dd>{payment.projectId ? <Link className="underline underline-offset-4" href={`/internal/projects/${payment.projectId}/planning/milestones`}>{payment.milestone.title}</Link> : payment.milestone.title}</dd>
          </>)}
        </dl>

        {tabs.length > 1 && (
          <div role="tablist" aria-label="Secciones de la cuota" className="flex gap-4 border-b text-sm">
            {tabs.map((value) => (
              <button key={value} type="button" role="tab" id={`payment-tab-${value}`} aria-controls={`payment-panel-${value}`} aria-selected={tab === value} onClick={() => setTab(value)} className={`-mb-px border-b-2 pb-2 ${tab === value ? 'border-blue-600 font-semibold text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
                {TAB_LABELS[value]}
              </button>
            ))}
          </div>
        )}

        <div role={tabs.length > 1 ? 'tabpanel' : undefined} id={`payment-panel-${tab}`} aria-labelledby={tabs.length > 1 ? `payment-tab-${tab}` : undefined}>
          {tab === 'remind' && <RemindForm payment={payment} balance={balance} today={today} settings={reminder} previous={history?.reminders} onDone={() => done('Recordatorio registrado')} />}
          {tab === 'register' && <RegisterForm payment={payment} balance={balance} today={today} onDone={() => done('Pago registrado')} />}
          {tab === 'verify' && <VerifyForm payment={payment} balance={balance} onDone={done} />}
          {tab === 'history' && (
            historyError ? <p role="alert" className="text-sm text-destructive">{historyError}</p>
              : !history ? <p className="text-sm text-muted-foreground" aria-live="polite">Cargando historial…</p>
                : <HistoryPanel history={history} isAdmin={isAdmin} onChanged={() => { router.refresh(); setReload((value) => value + 1); }} />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function RegisterForm({ payment, balance, today, onDone }: { payment: AgendaPayment; balance: number; today: string; onDone: () => void }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setError(null);
    const data = new FormData(event.currentTarget);
    if (!(data.get('file') instanceof File) || !(data.get('file') as File).size) data.delete('file');
    try {
      await send(`/api/backend/payments/${payment.id}/records`, { method: 'POST', body: data }, 'No pudimos registrar el pago');
      onDone();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No pudimos registrar el pago');
    } finally {
      setPending(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <label className="block text-sm font-medium">Monto recibido ({payment.currency})
          <input required name="amount" type="number" min="0.01" max={balance.toFixed(2)} step="0.01" inputMode="decimal" defaultValue={balance.toFixed(2)} className={`${field} tabular-nums`} />
        </label>
        <label className="block text-sm font-medium">Fecha
          <input required name="paidAt" type="date" max={today} defaultValue={today} className={field} />
        </label>
      </div>
      <p className="-mt-2 text-xs text-muted-foreground">Si recibiste menos que {formatCurrency(balance, payment.currency)}, la cuota queda como parcial y sigue en la agenda por el saldo.</p>
      <div className="grid grid-cols-2 gap-3">
        <label className="block text-sm font-medium">Canal
          <select name="channel" defaultValue="" className={field}>
            <option value="">Sin especificar</option>
            {PAYMENT_CHANNELS_LIST.map((channel) => <option key={channel.id} value={channel.id}>{channel.name}</option>)}
          </select>
        </label>
        <label className="block text-sm font-medium">N.º de operación
          <input name="reference" className={field} />
        </label>
      </div>
      <label className="block text-sm font-medium">Comprobante <span className="font-normal text-muted-foreground">(opcional)</span>
        <input name="file" type="file" accept="image/*,application/pdf" className={`${field} file:mr-3 file:rounded file:border-0 file:bg-slate-100 file:px-2 file:py-1 file:text-xs`} />
      </label>
      <label className="block text-sm font-medium">Nota <span className="font-normal text-muted-foreground">(opcional)</span>
        <textarea name="notes" rows={2} className={field} />
      </label>
      {error && <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
      <div className="flex justify-end"><Button type="submit" disabled={pending}>{pending ? 'Registrando…' : 'Registrar pago'}</Button></div>
    </form>
  );
}

function VerifyForm({ payment, balance, onDone }: { payment: AgendaPayment; balance: number; onDone: (message: string) => void }) {
  const [pending, setPending] = useState<'PAID' | 'PENDING' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [amount, setAmount] = useState(balance.toFixed(2));
  const isImage = payment.evidenceMimeType?.startsWith('image/') || /\.(jpe?g|png|webp|gif)$/i.test(payment.evidenceOriginalName ?? '');

  const decide = async (status: 'PAID' | 'PENDING') => {
    if (status === 'PENDING' && !notes.trim()) { setError('Escribe el motivo del rechazo: el cliente lo verá.'); return; }
    setPending(status);
    setError(null);
    try {
      await send(`/api/backend/payments/${payment.id}/verify`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, reviewNotes: notes.trim() || undefined, ...(status === 'PAID' ? { amount: Number(amount) } : {}) }),
      }, 'No pudimos guardar la verificación');
      onDone(status === 'PAID' ? 'Pago verificado' : 'Pago rechazado');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No pudimos guardar la verificación');
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-lg border bg-slate-50">
        {!payment.evidenceUrl ? <p className="p-4 text-sm text-muted-foreground">El cliente no adjuntó comprobante.</p>
          : isImage ? (
            // eslint-disable-next-line @next/next/no-img-element -- comprobante privado servido por el proxy
            <a href={payment.evidenceUrl} target="_blank" rel="noreferrer"><img src={`${payment.evidenceUrl}?inline=1`} alt={`Comprobante de ${payment.concept}`} className="max-h-72 w-full object-contain" /></a>
          ) : <a href={payment.evidenceUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-4 text-sm underline underline-offset-4"><Paperclip size={15} aria-hidden="true" />{payment.evidenceOriginalName || 'Ver comprobante'}<ExternalLink size={13} aria-hidden="true" /></a>}
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
        <dt className="text-muted-foreground">Canal</dt><dd>{formatPaymentChannelName(payment.paymentChannel)}</dd>
        <dt className="text-muted-foreground">Operación</dt><dd>{payment.transactionReference || '—'}</dd>
        <dt className="text-muted-foreground">Pagó el</dt><dd>{payment.paidAt ? formatShortDate(payment.paidAt) : '—'}</dd>
        {payment.clientNotes && (<><dt className="text-muted-foreground">Nota</dt><dd className="whitespace-pre-line">{payment.clientNotes}</dd></>)}
      </dl>
      <label className="block text-sm font-medium">Monto que llegó ({payment.currency})
        <input type="number" min="0.01" max={balance.toFixed(2)} step="0.01" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} className={`${field} tabular-nums`} />
      </label>
      <label className="block text-sm font-medium">Nota para el cliente <span className="font-normal text-muted-foreground">(obligatoria si rechazas)</span>
        <textarea rows={2} value={notes} onChange={(event) => setNotes(event.target.value)} className={field} />
      </label>
      {error && <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" disabled={pending !== null} onClick={() => decide('PENDING')}>{pending === 'PENDING' ? 'Rechazando…' : 'Rechazar'}</Button>
        <Button type="button" disabled={pending !== null} onClick={() => decide('PAID')}>{pending === 'PAID' ? 'Aprobando…' : 'Aprobar pago'}</Button>
      </div>
    </div>
  );
}

function RemindForm({ payment, balance, today, settings, previous, onDone }: { payment: AgendaPayment; balance: number; today: string; settings: ReminderSettings; previous?: PaymentHistory['reminders']; onDone: () => void }) {
  const phone = normalizePhone(payment.client.whatsapp || payment.client.phone);
  const [channel, setChannel] = useState<'WHATSAPP' | 'COPY'>(phone ? 'WHATSAPP' : 'COPY');
  const [message, setMessage] = useState(() => renderReminder(settings.template, {
    concept: payment.concept, currency: payment.currency, balance, dueDate: payment.dueDate, today,
    contactName: payment.client.name, projectName: payment.project?.name, companyName: settings.companyName,
    portalUrl: `${window.location.origin}/client/payments`,
  }));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  /** Plan B cuando el navegador no deja abrir WhatsApp o copiar: la persona lo hace a mano y luego se registra. */
  const [fallback, setFallback] = useState<'blocked' | 'copy' | null>(null);

  const log = async () => {
    setPending(true);
    setError(null);
    try {
      await send(`/api/backend/payments/${payment.id}/reminders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel, message, phone: channel === 'WHATSAPP' ? phone : undefined }),
      }, 'No pudimos registrar el recordatorio');
      onDone();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No pudimos registrar el recordatorio');
    } finally {
      setPending(false);
    }
  };

  const submit = async () => {
    if (!message.trim()) { setError('Escribe el mensaje.'); return; }
    setFallback(null);
    if (channel === 'WHATSAPP' && phone) {
      // Se abre en el mismo clic para que el navegador no lo bloquee. Sin `noopener` en los
      // parámetros: con él `window.open` siempre devuelve null y no sabríamos si se bloqueó.
      const win = window.open(whatsappUrl(phone, message), '_blank');
      if (!win) { setFallback('blocked'); return; }
      win.opener = null;
    } else {
      try {
        await navigator.clipboard.writeText(message);
        toast.success('Mensaje copiado');
      } catch {
        textRef.current?.select();
        setFallback('copy');
        return;
      }
    }
    await log();
  };

  return (
    <div className="space-y-4">
      <div role="radiogroup" aria-label="Cómo enviarlo" className="grid grid-cols-2 overflow-hidden rounded-md border text-sm">
        {([['WHATSAPP', 'WhatsApp'], ['COPY', 'Copiar texto']] as const).map(([value, label]) => (
          <button key={value} type="button" role="radio" aria-checked={channel === value} disabled={value === 'WHATSAPP' && !phone} onClick={() => setChannel(value)} className="py-2 transition aria-checked:bg-blue-50 aria-checked:font-semibold aria-checked:text-blue-800 disabled:cursor-not-allowed disabled:opacity-50">{label}</button>
        ))}
      </div>
      {channel === 'COPY' && phone ? <p className="-mt-2 text-xs text-muted-foreground">Copia el texto para enviarlo por otro medio. El recordatorio queda registrado al copiarlo.</p>
        : phone ? <p className="-mt-2 text-xs text-muted-foreground">Se abre WhatsApp con +{phone}. El recordatorio queda registrado al abrirlo.</p>
        : <p className="-mt-2 text-xs text-muted-foreground">{payment.client.businessName || payment.client.name} no tiene WhatsApp registrado. Copia el texto, o agrégalo en <Link className="underline underline-offset-4" href={`/internal/clients/${payment.client.id}`}>su ficha</Link>.</p>}
      <label className="block text-sm font-medium">Mensaje
        <textarea ref={textRef} rows={9} value={message} onChange={(event) => setMessage(event.target.value)} maxLength={2000} className={field} />
      </label>
      {error && <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
      {fallback === 'blocked' && phone && <p role="alert" className="rounded-md bg-amber-50 p-3 text-sm text-amber-900">Tu navegador bloqueó la ventana de WhatsApp. <a className="font-semibold underline underline-offset-4" href={whatsappUrl(phone, message)} target="_blank" rel="noreferrer" onClick={() => void log()}>Ábrelo con este enlace</a>: al abrirlo queda registrado.</p>}
      {fallback === 'copy' && <p role="alert" className="rounded-md bg-amber-50 p-3 text-sm text-amber-900">No pudimos copiar automáticamente. El texto quedó seleccionado: cópialo con ⌘C o Ctrl+C. <button type="button" className="font-semibold underline underline-offset-4" onClick={() => void log()}>Ya lo copié, registrar</button></p>}
      <div className="flex justify-end"><Button type="button" disabled={pending} onClick={submit}>{pending ? 'Registrando…' : channel === 'WHATSAPP' ? 'Abrir WhatsApp y registrar' : 'Copiar y registrar'}</Button></div>
      {previous && previous.length > 0 && (
        <section aria-labelledby="reminders-title">
          <h3 id="reminders-title" className="mb-2 text-xs font-bold tracking-wider text-slate-500 uppercase">Recordatorios anteriores</h3>
          <ul className="space-y-1.5 text-sm">
            {previous.map((item) => <li key={item.id} className="text-slate-700">{dateTime.format(new Date(item.sentAt))} · {item.channel === 'WHATSAPP' ? 'WhatsApp' : 'texto copiado'}{item.sentBy && <span className="text-muted-foreground"> · {item.sentBy.name}</span>}</li>)}
          </ul>
        </section>
      )}
    </div>
  );
}

const ACTIVITY_LABELS: Record<string, string> = {
  CREATED: 'Cuota creada',
  STATUS_CHANGED: 'Cambio de estado',
  PAYMENT_REPORTED: 'El cliente reportó un pago',
  PAYMENT_APPROVED: 'Pago verificado',
  PAYMENT_REJECTED: 'Pago rechazado',
  PAYMENT_RECORDED: 'Abono registrado',
  PAYMENT_RECORD_DELETED: 'Abono anulado',
  PAYMENT_REMINDED: 'Recordatorio enviado',
  UPDATED: 'Cuota editada',
};
const STATUS_LABELS: Record<string, string> = { PENDING: 'por cobrar', PARTIAL: 'pago parcial', PAID: 'pagada', CANCELLED: 'cancelada', SCHEDULED: 'esperando hito', UNDER_REVIEW: 'por verificar' };
function activityDetail(action: string, description: string | null) {
  if (!description || action === 'CREATED' || action === 'UPDATED') return null;
  if (action === 'STATUS_CHANGED') return STATUS_LABELS[description] ?? description;
  return description;
}
const dateTime = new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'America/Lima' });

function HistoryPanel({ history, isAdmin, onChanged }: { history: PaymentHistory; isAdmin: boolean; onChanged: () => void }) {
  return (
    <div className="space-y-6">
      <section aria-labelledby="records-title">
        <h3 id="records-title" className="mb-2 text-xs font-bold tracking-wider text-slate-500 uppercase">Abonos</h3>
        {history.records.length === 0 ? <p className="text-sm text-muted-foreground">Todavía no se registró ningún pago.</p> : (
          <ul className="divide-y rounded-lg border">
            {history.records.map((record) => (
              <li key={record.id} className="flex items-start justify-between gap-3 p-3 text-sm">
                <div className="min-w-0">
                  <p className="font-semibold tabular-nums">{formatCurrency(record.amount, history.currency)} <span className="font-normal text-muted-foreground">· {formatShortDate(record.paidAt)}</span></p>
                  <p className="text-xs text-muted-foreground">
                    {[record.channel && formatPaymentChannelName(record.channel), record.reference && `Op. ${record.reference}`, record.createdBy && `por ${record.createdBy.name}`].filter(Boolean).join(' · ') || 'Sin detalle'}
                  </p>
                  {record.notes && <p className="mt-1 text-xs whitespace-pre-line text-slate-700">{record.notes}</p>}
                  {record.evidenceUrl && <a href={record.evidenceUrl} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs underline underline-offset-4"><Paperclip size={12} aria-hidden="true" />{record.evidenceOriginalName || 'Comprobante'}</a>}
                </div>
                {isAdmin && <DeleteRecord paymentId={history.id} recordId={record.id} label={formatCurrency(record.amount, history.currency)} onDeleted={onChanged} />}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="activity-title">
        <h3 id="activity-title" className="mb-2 text-xs font-bold tracking-wider text-slate-500 uppercase">Actividad</h3>
        {history.activity.length === 0 ? <p className="text-sm text-muted-foreground">Sin actividad registrada.</p> : (
          <ol className="space-y-3 border-l pl-4">
            {history.activity.map((entry) => (
              <li key={entry.id} className="text-sm">
                <p className="text-slate-900">{ACTIVITY_LABELS[entry.action] ?? entry.action}{activityDetail(entry.action, entry.description) && <span className="text-slate-600"> · {activityDetail(entry.action, entry.description)}</span>}</p>
                <p className="text-xs text-muted-foreground">{dateTime.format(new Date(entry.createdAt))}{entry.actor && ` · ${entry.actor.name}`}</p>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

function DeleteRecord({ paymentId, recordId, label, onDeleted }: { paymentId: string; recordId: string; label: string; onDeleted: () => void }) {
  const [pending, setPending] = useState(false);
  const remove = async () => {
    setPending(true);
    try {
      await send(`/api/backend/payments/${paymentId}/records/${recordId}`, { method: 'DELETE' }, 'No pudimos anular el abono');
      toast.success('Abono anulado');
      onDeleted();
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : 'No pudimos anular el abono');
    } finally {
      setPending(false);
    }
  };
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild><Button size="xs" variant="ghost" disabled={pending}>{pending ? 'Anulando…' : 'Anular'}</Button></AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Anular el abono de {label}?</AlertDialogTitle>
          <AlertDialogDescription>La cuota vuelve a deber ese monto y la anulación queda en la actividad. Úsalo solo si el pago se registró por error.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={remove}>Anular abono</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
