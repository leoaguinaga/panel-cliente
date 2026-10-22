'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, Copy, RotateCw, Video, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { LeadMeeting } from '@/src/lib/api/contracts';
import type { LeadItem } from '@/components/kanban/LeadKanban';
import { addDays, limaDayKey } from '@/components/kanban/LeadSheet';

type Worker = { id: string; name: string };
type Google = { configured: boolean; connected: boolean; email: string | null };

const DURATIONS = [15, 30, 45, 60, 90];
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const monthFormat = new Intl.DateTimeFormat('es-PE', { month: 'short', timeZone: 'UTC' });
const weekdayFormat = new Intl.DateTimeFormat('es-PE', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
const atNoon = (key: string) => new Date(`${key}T12:00:00Z`);

function endTime(time: string, minutes: number) {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + minutes;
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

async function calendarApi<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/backend/calendar/${path}`, { ...init, headers: { 'Content-Type': 'application/json' }, cache: 'no-store' });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(Array.isArray(data?.message) ? data.message.join('. ') : data?.message || 'No se pudo guardar la reunión');
  return data as T;
}

/**
 * Reuniones con el prospecto. Al agendar se crea la reunión del calendario del
 * equipo ligada al lead y, si Google está conectado, el evento con su Meet.
 */
export function LeadMeetings({
  lead,
  meetings,
  workers,
  currentUserId,
  google,
  disabled,
  openSignal,
  onScheduled,
}: {
  lead: LeadItem;
  meetings: LeadMeeting[];
  workers: Worker[];
  currentUserId: string;
  google: Google | null;
  disabled: boolean;
  /** Cambia cuando el encabezado pide abrir el formulario. */
  openSignal: number;
  onScheduled: () => void;
}) {
  const today = limaDayKey(new Date());
  const [formOpen, setFormOpen] = useState(false);
  const [showPast, setShowPast] = useState(false);

  const [seenSignal, setSeenSignal] = useState(openSignal);
  if (seenSignal !== openSignal) {
    setSeenSignal(openSignal);
    setFormOpen(true);
  }

  const upcoming = meetings
    .filter((m) => m.status !== 'CANCELLED' && m.date >= today)
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  const past = meetings.filter((m) => !upcoming.includes(m));

  return (
    <div className="space-y-2">
      {formOpen ? (
        <MeetingForm
          lead={lead}
          workers={workers}
          currentUserId={currentUserId}
          google={google}
          today={today}
          onCancel={() => setFormOpen(false)}
          onDone={() => {
            setFormOpen(false);
            onScheduled();
          }}
        />
      ) : (
        !disabled && (
          <button
            type="button"
            onClick={() => setFormOpen(true)}
            className="flex w-full items-center gap-3 rounded-xl border border-dashed p-3 text-left text-sm transition-colors hover:border-foreground/30 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/12 text-primary" aria-hidden="true">
              <Video className="size-4" />
            </span>
            <span className="min-w-0">
              <span className="block font-semibold">Agendar reunión por Meet</span>
              <span className="block text-[12.5px] text-muted-foreground">
                {lead.email ? `Le llega la invitación a ${lead.email}` : 'Añade su correo para enviarle la invitación'}
              </span>
            </span>
          </button>
        )
      )}

      {upcoming.map((meeting) => (
        <MeetingRow key={meeting.id} meeting={meeting} today={today} onSynced={onScheduled} />
      ))}

      {upcoming.length === 0 && past.length === 0 && disabled && (
        <p className="rounded-xl border border-dashed p-3 text-sm text-muted-foreground">Sin reuniones registradas.</p>
      )}

      {past.length > 0 && (
        <div>
          <button
            type="button"
            aria-expanded={showPast}
            onClick={() => setShowPast((value) => !value)}
            className="rounded-md px-1 py-0.5 text-xs font-semibold text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {showPast ? 'Ocultar anteriores' : `Anteriores (${past.length})`}
          </button>
          {showPast && (
            <div className="mt-2 space-y-2">
              {past.map((meeting) => (
                <MeetingRow key={meeting.id} meeting={meeting} today={today} onSynced={onScheduled} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MeetingRow({ meeting, today, onSynced }: { meeting: LeadMeeting; today: string; onSynced: () => void }) {
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const day = atNoon(meeting.date);
  const cancelled = meeting.status === 'CANCELLED';
  const isPast = meeting.date < today;
  const isToday = meeting.date === today;

  const sync = async () => {
    setSyncing(true);
    setError(null);
    try {
      await calendarApi(`entries/${meeting.id}/sync`, { method: 'POST' });
      onSynced();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el Meet');
    } finally {
      setSyncing(false);
    }
  };

  const copy = async () => {
    if (!meeting.meetUrl) return;
    try {
      await navigator.clipboard.writeText(meeting.meetUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  const syncError = error ?? (meeting.syncStatus === 'ERROR' ? meeting.syncError || 'Google no pudo crear la reunión' : null);

  return (
    <article className={cn('flex gap-3 rounded-xl border bg-card p-3', (cancelled || isPast) && 'opacity-60')}>
      <div className={cn('flex w-12 shrink-0 flex-col items-center justify-center rounded-lg border py-1.5', isToday && !cancelled ? 'border-primary/50 bg-primary/10 text-primary' : 'bg-background')}>
        <span className="text-lg font-bold leading-none tabular-nums">{day.getUTCDate()}</span>
        <span className="mt-0.5 text-[10.5px] font-semibold uppercase tracking-wide text-muted-foreground">{monthFormat.format(day).replace('.', '')}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className={cn('truncate text-sm font-semibold', cancelled && 'line-through')}>{meeting.title}</p>
        <p className="mt-0.5 text-[12.5px] text-muted-foreground">
          {isToday ? 'Hoy' : weekdayFormat.format(day).replace(/^./, (c) => c.toUpperCase())}
          {meeting.time && (
            <span className="tabular-nums">
              {' · '}
              {meeting.time}–{endTime(meeting.time, meeting.duration)}
            </span>
          )}
          {' · '}
          {meeting.owner.name}
        </p>
        {syncError && (
          <p role="alert" className="mt-1.5 text-[12.5px] text-rose-400">
            {syncError}
          </p>
        )}
        {!cancelled && !isPast && (
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            {meeting.meetUrl ? (
              <>
                <Button asChild size="xs" className="gap-1">
                  <a href={meeting.meetUrl} target="_blank" rel="noopener noreferrer">
                    <Video aria-hidden="true" />
                    Unirse a Meet
                  </a>
                </Button>
                <Button type="button" variant="outline" size="xs" className="gap-1" onClick={copy}>
                  {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
                  {copied ? 'Copiado' : 'Copiar enlace'}
                </Button>
              </>
            ) : meeting.useMeet ? (
              <>
                <span className="text-[12.5px] text-muted-foreground">Aún sin enlace de Meet</span>
                <Button type="button" variant="outline" size="xs" className="gap-1" onClick={sync} disabled={syncing}>
                  <RotateCw className={cn(syncing && 'animate-spin')} aria-hidden="true" />
                  {syncing ? 'Creando…' : syncError ? 'Reintentar' : 'Crear Meet'}
                </Button>
              </>
            ) : (
              <span className="text-[12.5px] text-muted-foreground">Sin videollamada</span>
            )}
            {meeting.sendInvites && meeting.meetUrl && <span className="text-[12px] text-muted-foreground">· Invitación enviada</span>}
          </div>
        )}
        {cancelled && <p className="mt-1 text-[12.5px] text-muted-foreground">Cancelada</p>}
      </div>
    </article>
  );
}

const field = 'mt-1 block h-9 w-full rounded-lg border bg-background px-2.5 text-[13px] font-normal text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring';

function MeetingForm({
  lead,
  workers,
  currentUserId,
  google,
  today,
  onCancel,
  onDone,
}: {
  lead: LeadItem;
  workers: Worker[];
  currentUserId: string;
  google: Google | null;
  today: string;
  onCancel: () => void;
  onDone: () => void;
}) {
  const router = useRouter();
  const ids = useId();
  const dateRef = useRef<HTMLInputElement>(null);
  const business = lead.companyName || lead.name;
  const defaultOwner = workers.some((w) => w.id === lead.assignedTo?.id) ? lead.assignedTo!.id : currentUserId;
  const [guests, setGuests] = useState<string[]>(lead.email ? [lead.email.toLowerCase()] : []);
  const [guestDraft, setGuestDraft] = useState('');
  const [sendInvites, setSendInvites] = useState(Boolean(lead.email));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const googleReady = Boolean(google?.connected);

  useEffect(() => {
    dateRef.current?.focus({ preventScroll: true });
    dateRef.current?.closest('form')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, []);

  const addGuest = () => {
    const value = guestDraft.trim().toLowerCase().replace(/[,;]$/, '');
    if (!value) return true;
    if (!emailPattern.test(value)) {
      setError(`«${value}» no es un correo válido.`);
      return false;
    }
    setError(null);
    setGuests((list) => (list.includes(value) ? list : [...list, value]));
    setGuestDraft('');
    return true;
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!addGuest()) return;
    const form = new FormData(event.currentTarget);
    const text = (key: string) => String(form.get(key) || '').trim();
    const pendingGuest = guestDraft.trim().toLowerCase();
    const attendees = pendingGuest && !guests.includes(pendingGuest) ? [...guests, pendingGuest] : guests;
    if (!text('date') || !text('time')) {
      setError('Elige el día y la hora.');
      return;
    }
    setPending(true);
    setError(null);
    try {
      await calendarApi('entries', {
        method: 'POST',
        body: JSON.stringify({
          kind: 'meeting',
          meetingType: 'CLIENT',
          title: text('title') || `Reunión con ${business}`,
          date: text('date'),
          time: text('time'),
          duration: Number(text('duration')) || 30,
          ownerId: text('ownerId') || currentUserId,
          visibility: 'TEAM',
          leadId: lead.id,
          notes: text('notes'),
          attendees,
          useMeet: true,
          sendInvites: sendInvites && attendees.length > 0,
          status: 'OPEN',
        }),
      });
      // Un prospecto de entrada con reunión pasa a «Reunión agendada».
      if (lead.status === 'NEW' || lead.status === 'CONTACTED') {
        await fetch(`/api/backend/leads/${lead.id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'MEETING_SCHEDULED' }),
        }).catch(() => null);
      }
      onDone();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo agendar la reunión');
    } finally {
      setPending(false);
    }
  };

  return (
    <form onSubmit={submit} aria-labelledby={`${ids}-title`} className="rounded-xl border bg-card p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p id={`${ids}-title`} className="text-sm font-bold">
            Nueva reunión por Meet
          </p>
          <p className="mt-0.5 text-[12.5px] text-muted-foreground">Hora de Lima. Queda en el calendario del equipo.</p>
        </div>
        <Button type="button" variant="ghost" size="icon-xs" aria-label="Cerrar" onClick={onCancel}>
          <X aria-hidden="true" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-[1.3fr_1fr_1fr]">
        <label className="col-span-2 text-xs font-semibold text-muted-foreground sm:col-span-1">
          Día
          <input ref={dateRef} name="date" type="date" required min={today} defaultValue={addDays(today, 1)} className={field} />
        </label>
        <label className="text-xs font-semibold text-muted-foreground">
          Hora
          <input name="time" type="time" required step={900} defaultValue="10:00" className={cn(field, 'tabular-nums')} />
        </label>
        <label className="text-xs font-semibold text-muted-foreground">
          Duración
          <select name="duration" defaultValue="30" className={field}>
            {DURATIONS.map((minutes) => (
              <option key={minutes} value={minutes}>
                {minutes < 60 ? `${minutes} min` : `${minutes / 60} h${minutes % 60 ? ' 30' : ''}`}
              </option>
            ))}
          </select>
        </label>
        <label className="col-span-2 text-xs font-semibold text-muted-foreground sm:col-span-2">
          Título
          <input name="title" maxLength={120} defaultValue={`Reunión con ${business}`} className={field} />
        </label>
        <label className="col-span-2 text-xs font-semibold text-muted-foreground sm:col-span-1">
          Responsable
          <select name="ownerId" defaultValue={defaultOwner} className={field}>
            {workers.map((worker) => (
              <option key={worker.id} value={worker.id}>
                {worker.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-2.5">
        <label htmlFor={`${ids}-guest`} className="text-xs font-semibold text-muted-foreground">
          Invitados
        </label>
        <div className="mt-1 flex min-h-9 flex-wrap items-center gap-1.5 rounded-lg border bg-background px-1.5 py-1 focus-within:ring-2 focus-within:ring-ring">
          {guests.map((guest) => (
            <span key={guest} className="inline-flex max-w-full items-center gap-1 rounded-md bg-muted py-0.5 pl-2 pr-1 text-[12.5px]">
              <span className="truncate">{guest}</span>
              <button
                type="button"
                aria-label={`Quitar a ${guest}`}
                onClick={() => setGuests((list) => list.filter((item) => item !== guest))}
                className="grid size-4 place-items-center rounded text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="size-3" aria-hidden="true" />
              </button>
            </span>
          ))}
          <input
            id={`${ids}-guest`}
            type="email"
            value={guestDraft}
            onChange={(event) => setGuestDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ',' || event.key === ' ') {
                if (guestDraft.trim()) {
                  event.preventDefault();
                  addGuest();
                }
              } else if (event.key === 'Backspace' && !guestDraft && guests.length) {
                setGuests((list) => list.slice(0, -1));
              }
            }}
            onBlur={() => guestDraft.trim() && addGuest()}
            placeholder={guests.length ? 'Añadir otro correo' : 'correo@negocio.com'}
            className="h-7 min-w-40 flex-1 bg-transparent px-1 text-[13px] outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <label className="mt-2.5 block text-xs font-semibold text-muted-foreground">
        Agenda <span className="font-normal">(opcional, va en la invitación)</span>
        <textarea name="notes" rows={2} maxLength={5000} placeholder="Revisar la maqueta, alcance y presupuesto…" className="mt-1 block w-full resize-y rounded-lg border bg-background px-2.5 py-2 text-[13px] font-normal text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring" />
      </label>

      <label className="mt-3 flex cursor-pointer items-center gap-2 text-[13px]">
        <input type="checkbox" checked={sendInvites} onChange={(event) => setSendInvites(event.target.checked)} className="size-4 accent-[var(--primary)]" />
        Enviar la invitación por correo a los invitados
      </label>

      {!googleReady && (
        <p className="mt-3 rounded-lg border border-amber-500/35 bg-amber-500/10 p-2.5 text-[12.5px] text-amber-200">
          Google Calendar no está conectado: la reunión se guarda en el calendario y el Meet se crea cuando lo conectes en{' '}
          <Link href="/internal/settings" className="font-semibold underline underline-offset-2">
            Configuración
          </Link>
          .
        </p>
      )}

      {error && (
        <p role="alert" className="mt-3 text-[12.5px] text-rose-400">
          {error}
        </p>
      )}

      <div className="mt-4 flex items-center justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" size="sm" className="gap-1.5" disabled={pending}>
          <Video aria-hidden="true" />
          {pending ? 'Agendando…' : googleReady ? 'Agendar y crear Meet' : 'Agendar reunión'}
        </Button>
      </div>
    </form>
  );
}
