'use client';

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { PublicProposalResponse, type ResponseAction } from './PublicProposalResponse';

type Opened = {
  needsPin: false;
  proposal: { code: string; version: number; title: string; client: string; status: string; validUntil: string | null };
  file: string;
};
type State =
  | { kind: 'loading' }
  | { kind: 'pin'; error?: string }
  | { kind: 'locked'; message: string }
  | { kind: 'unavailable' }
  | { kind: 'ready'; data: Opened };


/** Abre el enlace (con PIN si hace falta) y traduce la respuesta a lo que se muestra. */
async function openShare(token: string, pin?: string): Promise<State> {
  try {
    const response = await fetch('/api/backend/public/proposals/open', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, pin: pin || undefined }),
    });
    const data = await response.json().catch(() => null);
    const message = Array.isArray(data?.message) ? data.message.join('. ') : data?.message;
    if (response.ok && data?.needsPin) return { kind: 'pin' };
    if (response.ok) return { kind: 'ready', data: data as Opened };
    if (response.status === 401) return { kind: 'pin', error: message || 'El PIN no es correcto' };
    if (response.status === 429) return { kind: 'locked', message: message || 'Demasiados intentos. Vuelve a probar en unos minutos.' };
  } catch {
    // Sin conexión o respuesta rara: el mismo aviso neutro.
  }
  return { kind: 'unavailable' };
}

/**
 * Lo que ve el cliente en /p/<token>: la propuesta a pantalla completa en un
 * iframe aislado (la CSP del servidor le quita el origen del panel), o el PIN,
 * o un aviso neutro si el enlace ya no sirve.
 */
export function PublicProposal({ token }: { token: string }) {
  const [state, setState] = useState<State>({ kind: 'loading' });
  const [pin, setPin] = useState('');
  const [sending, setSending] = useState(false);
  const frame = useRef<HTMLIFrameElement>(null);
  const [action, setAction] = useState<ResponseAction | null>(null);
  // Lo último que marcó el cliente en el cotizador de la propuesta.
  const [addonIds, setAddonIds] = useState<string[]>([]);

  useEffect(() => {
    let alive = true;
    void openShare(token).then((next) => alive && setState(next));
    return () => {
      alive = false;
    };
  }, [token]);

  useEffect(() => {
    if (state.kind === 'ready') document.title = `Propuesta para ${state.data.proposal.client} — FoxCode`;
  }, [state]);

  // Solo se escucha a la propuesta de este iframe (bridge.js); el resto se ignora.
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.source !== frame.current?.contentWindow || event.data?.source !== 'foxcode-proposal') return;
      if (event.data.type === 'fox:action') setAction(event.data.action === 'accept' ? 'accept' : 'schedule');
      if (event.data.type === 'fox:addons' && Array.isArray(event.data.ids)) setAddonIds(event.data.ids.filter((id: unknown) => typeof id === 'string').slice(0, 30));
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!/^\d{4,6}$/.test(pin)) return;
    setSending(true);
    void openShare(token, pin).then((next) => {
      setState(next);
      setSending(false);
    });
  };

  if (state.kind === 'ready')
    return (
      <>
        <iframe
          ref={frame}
          title={`Propuesta para ${state.data.proposal.client}`}
          src={`/api/backend/public/proposals/file/${state.data.file}`}
          referrerPolicy="no-referrer"
          className="fixed inset-0 h-dvh w-full border-0 bg-[#18181a]"
        />
        <PublicProposalResponse
          action={action}
          token={token}
          pin={pin}
          addonIds={addonIds}
          client={state.data.proposal.client}
          code={state.data.proposal.code}
          onClose={() => setAction(null)}
        />
      </>
    );

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#18181a] px-4 py-10 text-[#fffff1]">
      <div className="w-full max-w-sm text-center">
        {/* eslint-disable-next-line @next/next/no-img-element -- logo estático, sin optimizar a propósito */}
        <img src="/logos/logo-full-white.webp" alt="FoxCode" className="mx-auto h-7 w-auto" />
        {state.kind === 'loading' && (
          <p className="mt-10 text-sm text-white/60" role="status">
            Abriendo la propuesta…
          </p>
        )}
        {state.kind === 'unavailable' && (
          <Screen title="Esta propuesta ya no está disponible">Puede que el enlace haya vencido o que lo hayamos reemplazado. Escríbenos y te enviamos una versión al día.</Screen>
        )}
        {state.kind === 'locked' && <Screen title="Espera un momento">{state.message}</Screen>}
        {state.kind === 'pin' && (
          <Screen title="Esta propuesta tiene PIN">
            Escribe el PIN que te enviamos por separado.
            <form onSubmit={submit} className="mt-6 space-y-3">
              <input
                value={pin}
                onChange={(event) => setPin(event.target.value.replace(/\D/g, '').slice(0, 6))}
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus
                aria-label="PIN"
                aria-invalid={Boolean(state.error)}
                className="block h-12 w-full rounded-xl border border-white/15 bg-white/5 text-center text-xl tracking-[0.5em] tabular-nums text-white outline-none focus-visible:ring-2 focus-visible:ring-[#ee4d31]"
              />
              {state.error && (
                <p role="alert" className="text-sm text-[#ff6b57]">
                  {state.error}
                </p>
              )}
              <Button type="submit" className="h-11 w-full" disabled={sending || !/^\d{4,6}$/.test(pin)}>
                {sending ? 'Verificando…' : 'Ver propuesta'}
              </Button>
            </form>
          </Screen>
        )}
      </div>
    </main>
  );
}

function Screen({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mt-10">
      <h1 className="font-display text-4xl leading-none tracking-wide">{title}</h1>
      <div className="mt-3 text-sm text-white/65">{children}</div>
    </div>
  );
}
