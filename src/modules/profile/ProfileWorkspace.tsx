'use client';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Camera, CircleAlert, CircleCheck, Circle, Eye, EyeOff, Globe, KeyRound, Laptop, Loader2, Lock, LogOut, Smartphone, Tablet, BellOff, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { changePasswordAction, removeAvatarAction, revokeOtherSessionsAction, revokeSessionAction, saveHourFormatAction, updateProfileAction } from './server/actions';
import { describeDevice, JOB_TITLE_SUGGESTIONS, type Profile, type ProfileSession } from './types';
import styles from './profile.module.css';

const MAX_AVATAR = 2 * 1024 * 1024;
const SECTIONS = [['identidad', 'Identidad'], ['seguridad', 'Seguridad'], ['preferencias', 'Preferencias']] as const;
const rtf = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });

function relative(date: string | null) {
  if (!date) return null;
  const seconds = (new Date(date).getTime() - Date.now()) / 1000;
  const steps: [number, Intl.RelativeTimeFormatUnit][] = [[60, 'second'], [60, 'minute'], [24, 'hour'], [30, 'day'], [12, 'month'], [Infinity, 'year']];
  let value = seconds;
  for (const [size, unit] of steps) {
    if (Math.abs(value) < size) return unit === 'second' ? 'hace un momento' : rtf.format(Math.round(value), unit);
    value /= size;
  }
  return null;
}
const monthYear = (date: string) => new Intl.DateTimeFormat('es-PE', { month: 'long', year: 'numeric', timeZone: 'America/Lima' }).format(new Date(date));

/** Recorta al centro en cuadrado y reduce a 512 px antes de subir; si el navegador no puede, sube el original. */
async function squareImage(file: File): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file);
    const side = Math.min(bitmap.width, bitmap.height), size = Math.min(512, side);
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    canvas.getContext('2d')!.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, size, size);
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/webp', 0.9));
    return blob && blob.size <= MAX_AVATAR && ['image/webp', 'image/png', 'image/jpeg'].includes(blob.type) ? blob : file;
  } catch { return file; }
}

export function ProfileWorkspace({ profile, sessions: initialSessions, hourFormat: initialHourFormat }: { profile: Profile; sessions: ProfileSession[]; hourFormat: string }) {
  const router = useRouter();
  const [saved, setSaved] = useState({ name: profile.name, jobTitle: profile.jobTitle || '', phone: profile.phone || '' });
  const [form, setForm] = useState(saved);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [image, setImage] = useState(profile.image);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const [active, setActive] = useState<string>('identidad');
  const [hourFormat, setHourFormat] = useState<'12' | '24'>(initialHourFormat === '12' ? '12' : '24');

  const dirty = form.name.trim() !== saved.name || form.jobTitle.trim() !== saved.jobTitle || form.phone.trim() !== saved.phone;
  const nameMissing = !form.name.trim();
  const previewUser = { id: profile.id, name: form.name.trim() || profile.name, image };
  const title = form.jobTitle.trim();

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (visible) setActive(visible.target.id);
    }, { rootMargin: '-15% 0px -65% 0px' });
    SECTIONS.forEach(([id]) => { const el = document.getElementById(id); if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  function set(key: keyof typeof form, value: string) { setForm(current => ({ ...current, [key]: value })); setSaveError(''); }

  async function save() {
    if (nameMissing) { document.getElementById('profile-name')?.focus(); return; }
    setSaving(true); setSaveError('');
    const values = { name: form.name.trim(), jobTitle: form.jobTitle.trim(), phone: form.phone.trim() };
    const result = await updateProfileAction(values).catch(() => ({ ok: false, error: 'No se pudo guardar. Revisa tu conexión e intenta de nuevo.' }));
    setSaving(false);
    if (!result.ok) { setSaveError(result.error || 'No se pudo guardar.'); return; }
    setSaved(values); setForm(values);
    toast.success('Perfil actualizado. El equipo ya ve los cambios.');
    router.refresh();
  }

  async function pickPhoto(file?: File) {
    if (!file) return;
    setPhotoError('');
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { setPhotoError('Usa una imagen JPG, PNG o WebP.'); return; }
    if (file.size > MAX_AVATAR * 4) { setPhotoError('Esa imagen pesa más de 8 MB. Elige una más liviana.'); return; }
    setPhotoBusy(true);
    try {
      const blob = await squareImage(file);
      if (blob.size > MAX_AVATAR) { setPhotoError('Esa imagen pesa más de 2 MB. Elige una más liviana.'); return; }
      const data = new FormData();
      data.append('file', blob, `avatar.${blob.type.split('/')[1] || 'jpg'}`);
      const response = await fetch('/api/backend/me/avatar', { method: 'POST', body: data });
      const body = await response.json().catch(() => null);
      if (!response.ok) { setPhotoError(Array.isArray(body?.message) ? body.message.join('. ') : body?.message || 'No se pudo subir la foto. Intenta de nuevo.'); return; }
      setImage(body.image); toast.success('Foto actualizada.'); router.refresh();
    } catch { setPhotoError('No se pudo subir la foto. Revisa tu conexión e intenta de nuevo.'); }
    finally { setPhotoBusy(false); if (fileRef.current) fileRef.current.value = ''; }
  }

  async function removePhoto() {
    setPhotoBusy(true); setPhotoError('');
    const result = await removeAvatarAction().catch(() => ({ ok: false, error: 'No se pudo quitar la foto.' }));
    setPhotoBusy(false);
    if (!result.ok) { setPhotoError(result.error || 'No se pudo quitar la foto.'); return; }
    setImage(null); toast.success('Foto eliminada.'); router.refresh();
  }

  return <section className={styles.workspace}>
    <header className={styles.heading}>
      <h1>Mi perfil</h1>
      <p>Cómo te identifica el equipo, la seguridad de tu cuenta y tus preferencias.</p>
    </header>
    <nav className={styles.anchors} aria-label="Secciones del perfil">
      {SECTIONS.map(([id, label]) => <a key={id} href={`#${id}`} aria-current={active === id ? 'location' : undefined}>{label}</a>)}
    </nav>

    <div className={styles.grid}>
      <div className={styles.column}>
        <section id="identidad" className={styles.section} aria-labelledby="h-identidad">
          <h2 id="h-identidad">Identidad</h2>
          <p className={styles.lead}>Aparece en tareas, comentarios, el calendario y el menú.</p>

          <div className={styles.photo}>
            <UserAvatar user={previewUser} className={styles.bigAvatar} fallbackClassName="text-3xl rounded-[20px]" />
            <div>
              <div className={styles.photoActions}>
                <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={photoBusy}>
                  {photoBusy ? <Loader2 className="animate-spin" aria-hidden /> : <Camera aria-hidden />}{photoBusy ? 'Subiendo…' : image ? 'Cambiar foto' : 'Subir foto'}
                </Button>
                {image && <Button type="button" variant="ghost" size="sm" onClick={removePhoto} disabled={photoBusy}>Quitar</Button>}
                <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={event => pickPhoto(event.target.files?.[0])} />
              </div>
              <small className={photoError ? styles.errorText : undefined} role={photoError ? 'alert' : undefined}>{photoError || 'JPG, PNG o WebP de hasta 2 MB. Se recorta en cuadrado.'}</small>
            </div>
          </div>

          <div className={styles.fields}>
            <div className={styles.field}>
              <label htmlFor="profile-name">Nombre completo</label>
              <input id="profile-name" value={form.name} onChange={e => set('name', e.target.value)} autoComplete="name" maxLength={200} required aria-invalid={nameMissing} aria-describedby={nameMissing ? 'profile-name-error' : undefined} />
              {nameMissing && <small id="profile-name-error" className={styles.errorText}>Escribe tu nombre; el equipo lo ve en tareas y comentarios.</small>}
            </div>
            <div className={styles.field}>
              <label htmlFor="profile-title">Cargo o especialidad</label>
              <input id="profile-title" value={form.jobTitle} onChange={e => set('jobTitle', e.target.value)} maxLength={40} placeholder="Por ejemplo, Backend" list="profile-title-options" />
              <datalist id="profile-title-options">{JOB_TITLE_SUGGESTIONS.map(option => <option key={option} value={option} />)}</datalist>
              <div className={styles.chips} role="group" aria-label="Sugerencias de cargo">
                {JOB_TITLE_SUGGESTIONS.filter(option => option !== title).slice(0, 4).map(option => <button key={option} type="button" onClick={() => set('jobTitle', option)}>{option}</button>)}
              </div>
            </div>
            <div className={styles.field}>
              <label htmlFor="profile-phone">Teléfono o WhatsApp</label>
              <input id="profile-phone" value={form.phone} onChange={e => set('phone', e.target.value)} inputMode="tel" autoComplete="tel" maxLength={40} placeholder="+51 987 654 321" />
              <small>Lo usa el equipo para coordinar; los clientes no lo ven.</small>
            </div>
            <div className={styles.field}>
              <span className={styles.label} id="profile-mail">Correo de acceso</span>
              <div className={styles.readonly} aria-labelledby="profile-mail"><Lock aria-hidden /><span>{profile.email}</span></div>
              <small>Solo un administrador puede cambiarlo, desde Colaboradores.</small>
            </div>
          </div>
          <p className={styles.roleRow}>
            <span className={styles.pill}><i className={styles.dot} aria-hidden />Activo</span>
            <span className={styles.pill}>{profile.role === 'ADMIN' ? 'Administrador' : 'Colaborador'}</span>
            <span>En el equipo desde {monthYear(profile.createdAt)}. Los roles se asignan en Colaboradores.</span>
          </p>
        </section>

        <SecuritySection profile={profile} initialSessions={initialSessions} />
        <PreferencesSection hourFormat={hourFormat} onChange={setHourFormat} />
      </div>

      <aside className={styles.preview} aria-labelledby="preview-title">
        <h3 id="preview-title">Así te ve el equipo</h3>
        <p>Se actualiza mientras escribes.</p>
        <div className={styles.previewCard}>
          <div>
            <span className={styles.previewLabel}>En una tarea</span>
            <div className={styles.task}><small>FOX-42 · Acme Inc</small><b>Ajustar el header en móvil</b><Who user={previewUser} title={title} size="size-6" /></div>
          </div>
          <div>
            <span className={styles.previewLabel}>En un comentario</span>
            <div className={styles.comment}><UserAvatar user={previewUser} className="size-8 rounded-lg" /><div><p className={styles.commentHead}><b>{previewUser.name}</b><span>{title || 'Sin cargo'} · hace 2 min</span></p><p>Subí la versión 2 del menú. ¿La revisas?</p></div></div>
          </div>
          <div>
            <span className={styles.previewLabel}>En el calendario</span>
            <div className={styles.event}><b>{hourFormat === '12' ? '3:00 p. m.' : '15:00'}</b><span className={styles.eventText}>Revisión con Acme Inc</span><UserAvatar user={previewUser} className="size-6 rounded-md" fallbackClassName="text-[10px]" /></div>
          </div>
        </div>
      </aside>
    </div>

    <div className={styles.saveBar} data-open={dirty || undefined} data-error={saveError ? true : undefined} role="region" aria-label="Cambios sin guardar" aria-hidden={!dirty} inert={!dirty}>
      <p className={styles.saveMessage} role={saveError ? 'alert' : 'status'}><i aria-hidden />{saveError || 'Cambios sin guardar'}</p>
      <Button type="button" variant="ghost" onClick={() => { setForm(saved); setSaveError(''); }} disabled={saving}>Descartar</Button>
      <Button type="button" onClick={save} disabled={saving || nameMissing}>{saving && <Loader2 className="animate-spin" aria-hidden />}{saving ? 'Guardando…' : saveError ? 'Reintentar' : 'Guardar cambios'}</Button>
    </div>
  </section>;
}

function Who({ user, title, size }: { user: { id: string; name: string; image: string | null }; title: string; size: string }) {
  return <div className={styles.who}><UserAvatar user={user} className={`${size} rounded-md`} fallbackClassName="text-[10px]" /><span className={styles.whoText}><b>{user.name}</b><small>{title || 'Sin cargo'}</small></span></div>;
}

function SecuritySection({ profile, initialSessions }: { profile: Profile; initialSessions: ProfileSession[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState({ current: '', next: '', repeat: '' });
  const [show, setShow] = useState({ current: false, next: false, repeat: false });
  const [revokeOthers, setRevokeOthers] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');
  const [updatedAt, setUpdatedAt] = useState(profile.passwordUpdatedAt);
  const [sessions, setSessions] = useState(initialSessions);
  const [closing, setClosing] = useState<string | null>(null);
  const [confirmAll, setConfirmAll] = useState(false);
  const currentRef = useRef<HTMLInputElement>(null);
  const others = sessions.filter(session => !session.current);
  const checks = { len: values.next.length >= 10, diff: !!values.next && values.next !== values.current, eq: !!values.next && values.next === values.repeat };
  const ready = checks.len && checks.diff && checks.eq && !!values.current;

  useEffect(() => { if (open) currentRef.current?.focus(); }, [open]);

  function close() { setOpen(false); setValues({ current: '', next: '', repeat: '' }); setError(''); }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!ready || busy) return;
    setBusy(true); setError('');
    const result = await changePasswordAction({ currentPassword: values.current, newPassword: values.next, revokeOtherSessions: revokeOthers }).catch(() => ({ ok: false, error: 'No se pudo cambiar la contraseña. Intenta de nuevo.', data: undefined }));
    setBusy(false);
    if (!result.ok) { setError(result.error || 'No se pudo cambiar la contraseña.'); currentRef.current?.select(); return; }
    const revoked = result.data?.revokedSessions || 0;
    close(); setUpdatedAt(new Date().toISOString());
    if (revokeOthers) setSessions(rows => rows.filter(row => row.current));
    setDone(revoked ? `Contraseña actualizada. Cerramos tu sesión en ${revoked} ${revoked === 1 ? 'dispositivo' : 'dispositivos'} más.` : 'Contraseña actualizada.');
    router.refresh();
  }

  async function revoke(id: string) {
    setClosing(id);
    const result = await revokeSessionAction(id).catch(() => ({ ok: false, error: 'No se pudo cerrar esa sesión.' }));
    setClosing(null);
    if (!result.ok) { toast.error(result.error || 'No se pudo cerrar esa sesión.'); return; }
    setSessions(rows => rows.filter(row => row.id !== id)); toast.success('Sesión cerrada en ese dispositivo.');
  }

  async function revokeAll() {
    setClosing('all');
    const result = await revokeOtherSessionsAction().catch(() => ({ ok: false, error: 'No se pudieron cerrar las sesiones.' }));
    setClosing(null); setConfirmAll(false);
    if (!result.ok) { toast.error(result.error || 'No se pudieron cerrar las sesiones.'); return; }
    setSessions(rows => rows.filter(row => row.current)); toast.success('Cerramos tu sesión en los demás dispositivos.');
  }

  const field = (key: keyof typeof values, label: string, autoComplete: string, extra?: React.ReactNode) => <div className={styles.field}>
    <label htmlFor={`pw-${key}`}>{label}</label>
    <div className={styles.passwordInput}>
      <input ref={key === 'current' ? currentRef : undefined} id={`pw-${key}`} type={show[key] ? 'text' : 'password'} autoComplete={autoComplete} maxLength={128} value={values[key]} aria-invalid={key === 'current' && !!error} aria-describedby={key === 'next' ? 'pw-checks' : undefined} onChange={e => { setValues(v => ({ ...v, [key]: e.target.value })); setError(''); }} />
      <button type="button" aria-label={show[key] ? 'Ocultar contraseña' : 'Mostrar contraseña'} onClick={() => setShow(s => ({ ...s, [key]: !s[key] }))}>{show[key] ? <EyeOff aria-hidden /> : <Eye aria-hidden />}</button>
    </div>{extra}
  </div>;

  return <section id="seguridad" className={styles.section} aria-labelledby="h-seguridad">
    <h2 id="h-seguridad">Seguridad</h2>
    <p className={styles.lead}>Tu contraseña y los dispositivos con la sesión abierta.</p>

    <div className={styles.row}>
      <div><h3>Contraseña</h3><p>{updatedAt ? `Actualizada ${relative(updatedAt)}.` : 'Definida al crear tu cuenta.'}</p></div>
      {!open && <Button type="button" variant="outline" onClick={() => { setOpen(true); setDone(''); }} aria-expanded={false} aria-controls="password-form"><KeyRound aria-hidden />Cambiar contraseña</Button>}
    </div>
    {open && <form id="password-form" className={styles.passwordForm} onSubmit={submit} noValidate>
      {error && <p className={styles.alertError} role="alert"><CircleAlert aria-hidden />{error}</p>}
      {field('current', 'Contraseña actual', 'current-password')}
      {field('next', 'Nueva contraseña', 'new-password')}
      {field('repeat', 'Repite la nueva contraseña', 'new-password')}
      <ul id="pw-checks" className={styles.checks} aria-live="polite">
        {([['len', 'Al menos 10 caracteres'], ['diff', 'Distinta de la actual'], ['eq', 'Las dos coinciden']] as const).map(([key, label]) => <li key={key} data-ok={checks[key] || undefined}>{checks[key] ? <CircleCheck aria-hidden /> : <Circle aria-hidden />}{label}<span className="sr-only">{checks[key] ? ': cumplido' : ': pendiente'}</span></li>)}
      </ul>
      <label className={styles.checkbox}><input type="checkbox" checked={revokeOthers} onChange={e => setRevokeOthers(e.target.checked)} />Cerrar mi sesión en los demás dispositivos</label>
      <div className={styles.formActions}>
        <Button type="submit" disabled={!ready || busy}>{busy && <Loader2 className="animate-spin" aria-hidden />}{busy ? 'Actualizando…' : 'Actualizar contraseña'}</Button>
        <Button type="button" variant="ghost" onClick={close} disabled={busy}>Cancelar</Button>
      </div>
    </form>}
    {done && <p className={styles.alertOk} role="status"><CircleCheck aria-hidden />{done}</p>}

    <div className={styles.sessionsHead}>
      <div><h3>Sesiones abiertas</h3><p>{sessions.length <= 1 ? 'Solo este dispositivo.' : `${sessions.length} dispositivos.`}</p></div>
      {others.length > 0 && (confirmAll
        ? <span className={styles.confirm}>¿Cerrar {others.length} {others.length === 1 ? 'sesión' : 'sesiones'}?<Button type="button" size="sm" variant="destructive" onClick={revokeAll} disabled={closing === 'all'} autoFocus>{closing === 'all' && <Loader2 className="animate-spin" aria-hidden />}Cerrar</Button><Button type="button" size="sm" variant="ghost" onClick={() => setConfirmAll(false)}>Cancelar</Button></span>
        : <Button type="button" size="sm" variant="destructive" onClick={() => setConfirmAll(true)}><LogOut aria-hidden />Cerrar las demás</Button>)}
    </div>
    <ul className={styles.sessions}>
      {sessions.map(session => {
        const device = describeDevice(session.userAgent);
        const Icon = device.kind === 'phone' ? Smartphone : device.kind === 'tablet' ? Tablet : Laptop;
        return <li key={session.id}>
          <span className={styles.deviceIcon}><Icon aria-hidden /></span>
          <div className={styles.deviceText}>
            <b>{device.label}{session.current && <span className={styles.here}>Este dispositivo</span>}</b>
            <small>{session.current ? 'Activa ahora' : `Último uso ${relative(session.updatedAt)}`}{session.ipAddress ? ` · ${session.ipAddress}` : ''}</small>
          </div>
          {!session.current && <Button type="button" size="sm" variant="ghost" onClick={() => revoke(session.id)} disabled={closing === session.id} aria-label={`Cerrar sesión en ${device.label}`}>{closing === session.id ? <Loader2 className="animate-spin" aria-hidden /> : 'Cerrar'}</Button>}
        </li>;
      })}
    </ul>
  </section>;
}

function PreferencesSection({ hourFormat, onChange }: { hourFormat: '12' | '24'; onChange: (value: '12' | '24') => void }) {
  const router = useRouter();
  const [savedFlash, setSavedFlash] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  async function choose(value: '12' | '24') {
    const previous = hourFormat;
    onChange(value);
    const result = await saveHourFormatAction(value).catch(() => ({ ok: false, error: 'No se pudo guardar la preferencia.' }));
    if (!result.ok) {
      onChange(previous);
      toast.error(result.error || 'No se pudo guardar la preferencia.'); return;
    }
    setSavedFlash(true); clearTimeout(timer.current); timer.current = setTimeout(() => setSavedFlash(false), 1800);
    router.refresh();
  }

  return <section id="preferencias" className={styles.section} aria-labelledby="h-preferencias">
    <h2 id="h-preferencias">Preferencias <span className={styles.saved} data-on={savedFlash || undefined} role="status">{savedFlash && <><Check aria-hidden />Guardado</>}</span></h2>
    <p className={styles.lead}>Solo afectan a tu cuenta y se guardan al elegirlas.</p>
    <fieldset className={styles.radios}>
      <legend className={styles.label}>Formato de hora</legend>
      {([['12', '12 horas', '3:00 p. m.'], ['24', '24 horas', '15:00']] as const).map(([value, label, sample]) => <label key={value}>
        <input type="radio" name="hourFormat" value={value} checked={hourFormat === value} onChange={() => choose(value)} />
        <b>{label}</b><span>{sample}</span>
      </label>)}
    </fieldset>
    <div className={`${styles.field} ${styles.narrow}`}>
      <span className={styles.label} id="profile-tz">Zona horaria</span>
      <div className={styles.readonly} aria-labelledby="profile-tz"><Globe aria-hidden /><span>America/Lima (UTC−05:00)</span></div>
      <small>El calendario de todo el equipo usa la hora de Lima.</small>
    </div>
    <p className={styles.quiet}><BellOff aria-hidden />Los avisos de tareas y reuniones se configurarán aquí cuando llegue el módulo de notificaciones.</p>
  </section>;
}

