'use client';

import { useEffect, useRef, useState } from 'react';
import styles from '../auth.module.css';

const MIN = 10;
const MAX = 128;

type Problem = { title: string; detail: string };

// El medidor solo orienta: el backend exige únicamente 10 a 128 caracteres.
const LEVELS = [
  { label: 'Débil', hint: 'Combina mayúsculas, minúsculas, números y símbolos.' },
  { label: 'Aceptable', hint: 'Mezcla más tipos de caracteres o hazla más larga.' },
  { label: 'Buena', hint: 'Unos caracteres más la harían fuerte.' },
  { label: 'Fuerte', hint: 'Difícil de adivinar.' },
] as const;

const COMMON = /^(.)\1+$|0123|1234|2345|3456|4567|5678|6789|abcd|qwerty|asdf|password|contrase|foxcode/i;

function strength(value: string) {
  if (value.length < MIN) return 0;
  const kinds = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter(re => re.test(value)).length;
  let score = 1;
  if (kinds >= 3) score++;
  if (kinds === 4 || value.length >= 16) score++;
  if (value.length >= 14 && kinds >= 2) score++;
  if (COMMON.test(value)) score = Math.min(score, 1);
  return Math.min(score, 4);
}

// Traduce las respuestas del backend (class-validator viene en inglés).
function describe(message: string): Problem {
  if (/token/i.test(message) || /enlace|venci|expir/i.test(message))
    return { title: 'El enlace no es válido o ya venció.', detail: 'Pide uno nuevo al equipo de FoxCode.' };
  if (/longer than|shorter than|password/i.test(message))
    return { title: 'La contraseña no cumple el largo.', detail: `Usa entre ${MIN} y ${MAX} caracteres.` };
  return { title: 'No se pudo guardar la contraseña.', detail: message };
}

export default function SetPasswordPage() {
  const token = useRef('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<Problem | null>(null);
  useEffect(() => {
    token.current = new URLSearchParams(window.location.hash.slice(1)).get('token') || '';
  }, []);

  const longEnough = password.length >= MIN && password.length <= MAX;
  const matches = confirm.length > 0 && confirm === password;
  const mismatch = confirm.length > 0 && !password.startsWith(confirm);
  const valid = longEnough && matches;
  const score = strength(password);

  return <section className={styles.card} aria-labelledby="password-title"><h2 id="password-title" className="text-2xl font-semibold">Crea tu contraseña</h2><p className="mt-3 text-sm text-muted-foreground">Elige una contraseña de {MIN} a {MAX} caracteres para entrar a FoxCode.</p>
    <form method="post" noValidate className="mt-6 space-y-5" onSubmit={async event => {
      event.preventDefault(); setError(null);
      if (!valid) return;
      if (!token.current) { setError({ title: 'Falta el enlace del correo.', detail: 'Ábrelo desde tu correo. Si venció, solicita uno nuevo al equipo de FoxCode.' }); return; }
      setPending(true);
      try {
        const response = await fetch('/api/client-access/set-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: token.current, password }) });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(Array.isArray(data.message) ? data.message.join('. ') : data.message || data.error || '');
        setPassword(''); setConfirm(''); token.current = '';
        window.location.replace('/set-password/success');
      } catch (cause) { setError(describe(cause instanceof Error ? cause.message : '')); }
      finally { setPending(false); }
    }}><fieldset disabled={pending} className="space-y-5">
      <div className={styles.field}><label htmlFor="new-password">Nueva contraseña</label>
        <PasswordInput id="new-password" value={password} describedBy="password-strength" onChange={v => { setPassword(v); setError(null); }} />
        <div id="password-strength" className={styles.meter} data-level={password ? score : undefined} aria-live="polite">
          <div className={styles.bars} aria-hidden="true">{[1, 2, 3, 4].map(i => <span key={i} data-on={score >= i || undefined} />)}</div>
          <p>{!password ? `Mínimo ${MIN} caracteres.` : !longEnough
            ? password.length > MAX ? `Máximo ${MAX} caracteres.` : MIN - password.length === 1 ? 'Falta 1 carácter.' : `Faltan ${MIN - password.length} caracteres.`
            : <><strong>{LEVELS[score - 1].label}.</strong> {LEVELS[score - 1].hint}</>}</p>
        </div>
      </div>
      <div className={styles.field}><label htmlFor="confirm-password">Repetir contraseña</label>
        <PasswordInput id="confirm-password" value={confirm} invalid={mismatch} describedBy="confirm-hint" onChange={v => { setConfirm(v); setError(null); }} />
        <p id="confirm-hint" className={styles.hint} data-state={matches && longEnough ? 'ok' : mismatch ? 'bad' : undefined} aria-live="polite">
          {matches && longEnough ? 'Las contraseñas coinciden.' : mismatch ? 'Las contraseñas no coinciden.' : 'Escríbela otra vez para confirmarla.'}
        </p>
      </div>
    </fieldset>
    {error && <div className={styles.alert} role="alert">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16.5v.01" /></svg>
      <div><strong>{error.title}</strong> {error.detail}</div>
    </div>}
    <button type="submit" className={styles.submit} disabled={!valid || pending} aria-busy={pending}>{pending ? 'Guardando…' : 'Guardar contraseña'}</button></form>
  </section>;
}

function PasswordInput({ id, value, onChange, invalid, describedBy }: { id: string; value: string; onChange: (value: string) => void; invalid?: boolean; describedBy?: string }) {
  const [visible, setVisible] = useState(false);
  return <div className={`${styles.control} ${styles.withToggle}`}>
    <input id={id} type={visible ? 'text' : 'password'} autoComplete="new-password" maxLength={MAX} required value={value} aria-invalid={invalid || undefined} aria-describedby={describedBy} onChange={e => onChange(e.target.value)} />
    <button type="button" className={styles.toggle} aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'} aria-pressed={visible} onClick={() => setVisible(v => !v)}>
      {visible
        ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 3l18 18M10.6 5.6A9.6 9.6 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-3 3.8M6.2 6.9C3.9 8.6 2.5 12 2.5 12S6 18.5 12 18.5c1.6 0 3-.4 4.2-1M9.9 9.9a3 3 0 0 0 4.2 4.2" /></svg>
        : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" /><circle cx="12" cy="12" r="3" /></svg>}
    </button>
  </div>;
}
