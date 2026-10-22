'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';

export type ResponseAction = 'accept' | 'schedule';

type Props = {
  action: ResponseAction | null;
  token: string;
  pin?: string;
  addonIds: string[];
  client: string;
  code: string;
  onClose: () => void;
};

type Done = { kind: 'accepted'; converted: boolean } | { kind: 'scheduled'; date: string; time: string };

const field =
  'mt-1.5 block h-11 w-full rounded-xl border border-white/15 bg-white/5 px-3 text-[15px] text-white outline-none placeholder:text-white/35 focus-visible:ring-2 focus-visible:ring-[#ee4d31] [color-scheme:dark]';

/** Días de semana desde mañana, en hora de Lima, para el selector de fecha. */
function limaDay(offset: number) {
  const now = new Date(Date.now() - 5 * 3600_000);
  now.setUTCDate(now.getUTCDate() + offset);
  return now.toISOString().slice(0, 10);
}
const SLOTS = Array.from({ length: 22 }, (_, i) => `${String(8 + Math.floor(i / 2)).padStart(2, '0')}:${i % 2 ? '30' : '00'}`);
const longDate = (date: string) =>
  new Intl.DateTimeFormat('es-PE', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/Lima' }).format(new Date(`${date}T12:00:00-05:00`));

/**
 * Respuesta del cliente fuera del iframe de la propuesta: aceptar (nombre y
 * correo) o pedir una reunión (fecha y hora). Usa <dialog> nativo para el foco
 * y la tecla Escape.
 */
export function PublicProposalResponse({ action, token, pin, addonIds, client, code, onClose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('10:00');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState<Done | null>(null);

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (action && !element.open) {
      setError(null);
      setDone(null);
      element.showModal();
    } else if (!action && element.open) element.close();
  }, [action]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!action) return;
    setSending(true);
    setError(null);
    try {
      const response = await fetch(`/api/backend/public/proposals/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          action === 'accept'
            ? { token, pin: pin || undefined, name, email, role: role || undefined, addonIds }
            : { token, pin: pin || undefined, name, email, date, time, note: note || undefined },
        ),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error((Array.isArray(data?.message) ? data.message[0] : data?.message) || 'No pudimos registrar tu respuesta. Vuelve a intentarlo.');
      setDone(action === 'accept' ? { kind: 'accepted', converted: Boolean(data?.converted) } : { kind: 'scheduled', date: data.date, time: data.time });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos registrar tu respuesta.');
    } finally {
      setSending(false);
    }
  };

  const minDate = limaDay(1);
  const maxDate = limaDay(60);
  const weekend = date ? [0, 6].includes(new Date(`${date}T12:00:00-05:00`).getUTCDay()) : false;

  return (
    <dialog
      ref={dialog}
      onClose={onClose}
      aria-labelledby="response-title"
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-3xl border border-white/10 bg-[#18181a] p-0 text-[#fffff1] shadow-2xl backdrop:bg-black/70"
    >
      <div className="p-6 sm:p-7">
        {done ? (
          <div role="status">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#ee4d31]">{code}</p>
            <h2 id="response-title" className="mt-2 text-3xl font-extrabold leading-none tracking-tight">
              {done.kind === 'accepted' ? '¡Gracias! Empecemos.' : 'Listo, te esperamos.'}
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-white/70">
              {done.kind === 'accepted'
                ? `Registramos tu aceptación. En las próximas horas te escribimos a ${email} con el contrato para firma y el primer paso del proyecto.`
                : `Pediste una reunión el ${longDate(done.date)} a las ${done.time}. Te confirmamos la hora y el enlace de la videollamada en ${email}.`}
            </p>
            <Button type="button" className="mt-6 h-11 w-full" onClick={() => dialog.current?.close()}>
              Volver a la propuesta
            </Button>
          </div>
        ) : (
          <form onSubmit={submit} noValidate={false}>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#ee4d31]">{code}</p>
            <h2 id="response-title" className="mt-2 text-3xl font-extrabold leading-none tracking-tight">
              {action === 'schedule' ? 'Conversemos antes de decidir' : `Aceptar la propuesta para ${client}`}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-white/65">
              {action === 'schedule'
                ? 'Elige un día y una hora que te acomoden. Lo dejamos en nuestro calendario y te confirmamos por correo.'
                : 'Con tu nombre y correo registramos que dijiste que sí. Después te enviamos el contrato para firmar; nada se cobra hasta entonces.'}
            </p>
            <div className="mt-5 space-y-3.5">
              <label className="block text-sm font-medium">
                Tu nombre
                <input required maxLength={120} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} className={field} />
              </label>
              <label className="block text-sm font-medium">
                Correo
                <input required type="email" maxLength={160} autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={field} />
              </label>
              {action === 'accept' && (
                <label className="block text-sm font-medium">
                  Cargo <span className="font-normal text-white/50">(opcional)</span>
                  <input maxLength={120} autoComplete="organization-title" value={role} onChange={(e) => setRole(e.target.value)} className={field} />
                </label>
              )}
              {action === 'schedule' && (
                <>
                  <div className="grid grid-cols-[minmax(0,1fr)_120px] gap-3">
                    <label className="block text-sm font-medium">
                      Día
                      <input required type="date" min={minDate} max={maxDate} value={date} onChange={(e) => setDate(e.target.value)} aria-invalid={weekend} className={field} />
                    </label>
                    <label className="block text-sm font-medium">
                      Hora
                      <select value={time} onChange={(e) => setTime(e.target.value)} className={field}>
                        {SLOTS.map((slot) => (
                          <option key={slot} value={slot}>{slot}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                  {weekend && <p className="text-sm text-[#ff6b57]">Elige un día de lunes a viernes.</p>}
                  <label className="block text-sm font-medium">
                    ¿Algo que quieras tratar? <span className="font-normal text-white/50">(opcional)</span>
                    <textarea rows={2} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} className={`${field} h-auto resize-none py-2.5`} />
                  </label>
                </>
              )}
            </div>
            {error && (
              <p role="alert" className="mt-4 text-sm text-[#ff6b57]">
                {error}
              </p>
            )}
            <div className="mt-6 flex flex-col gap-2 sm:flex-row-reverse">
              <Button type="submit" className="h-11 flex-1" disabled={sending || weekend}>
                {sending ? 'Enviando…' : action === 'schedule' ? 'Pedir la reunión' : 'Acepto la propuesta'}
              </Button>
              <Button type="button" variant="ghost" className="h-11 text-white/70 hover:bg-white/10 hover:text-white" onClick={() => dialog.current?.close()}>
                Cancelar
              </Button>
            </div>
          </form>
        )}
      </div>
    </dialog>
  );
}
