'use client';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { updateClientProfileAction } from './server/client-actions';
import { authClient } from '@/src/lib/auth-client';
import Link from 'next/link';
import { ArrowUpRight, Building2, LockKeyhole, LogOut, Mail, MapPin, Phone } from 'lucide-react';
import styles from './client-profile.module.css';

export type ClientProfileData = {
  userName: string;
  userEmail: string;
  userPhone: string | null;
  client: { name: string; businessName: string | null; phone: string | null; address: string | null } | null;
};

function Detail({ label, value, icon: Icon }: { label: string; value?: string | null; icon: typeof Mail }) {
  return <div className={styles.field}><dt><Icon size={15} aria-hidden="true" />{label}</dt><dd data-empty={!value || undefined}>{value || 'No registrado'}</dd></div>;
}

export function ClientProfile({ data }: { data: ClientProfileData }) {
  const router = useRouter();
  const [saved, setSaved] = useState({ name: data.userName, phone: data.userPhone || '' });
  const [form, setForm] = useState(saved);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState('');
  async function signOut() {
    setSigningOut(true); setSignOutError('');
    try {
      const result = await authClient.signOut();
      if (result.error) throw new Error('Sign out failed');
      router.replace('/login');
      router.refresh();
    } catch {
      setSignOutError('No se pudo cerrar sesión. Intenta de nuevo.');
      setSigningOut(false);
    }
  }
  const dirty = form.name.trim() !== saved.name || form.phone.trim() !== saved.phone;
  const initials = (saved.name.trim().split(/\s+/).slice(0, 2).map(word => word[0]).join('').toUpperCase() || 'CL');
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('');
    try {
      const values = { name: form.name.trim(), phone: form.phone.trim() };
      const result = await updateClientProfileAction(values);
      if (!result.ok) { setError(result.error || 'No se pudo guardar. Intenta de nuevo.'); return; }
      setSaved(values); setForm(values); setMessage('Tus datos se han actualizado.'); router.refresh();
    } catch { setError('No se pudo guardar. Revisa tu conexión e intenta de nuevo.'); }
    finally { setBusy(false); }
  }

  return <div className={styles.workspace}>
    <header className={styles.heading}>
      <div><h1>Mi perfil</h1><p>Tu información de acceso y los datos de tu empresa, en un solo lugar.</p></div>
      <button type="button" className={styles.signOut} onClick={signOut} disabled={signingOut || busy} aria-busy={signingOut}><LogOut size={16} aria-hidden="true" />{signingOut ? 'Cerrando sesión…' : 'Cerrar sesión'}</button>
    </header>
    {signOutError && <p role="alert" className={styles.error}>{signOutError}</p>}
    <div className={styles.grid}>
      <div>
        <section id="identidad" className={styles.section} aria-labelledby="identity-title">
          <h2 id="identity-title">Identidad</h2><p className={styles.lead}>Los datos asociados a tu acceso al portal.</p>
          <div className={styles.identity}><span className={styles.avatar} aria-hidden="true">{initials}</span><div><h3>{saved.name}</h3><p>Cliente Foxcode</p></div></div>
          <form onSubmit={save}>
            <div className={styles.fields}>
              <div className={styles.field}><label htmlFor="client-name">Nombre</label><input id="client-name" name="name" autoComplete="name" required maxLength={200} value={form.name} disabled={busy} onChange={e => {setForm({...form, name: e.target.value}); setMessage('');}} /></div>
              <div className={styles.field}><label htmlFor="client-phone">Tu teléfono</label><input id="client-phone" name="phone" type="tel" autoComplete="tel" maxLength={40} placeholder="Ej. +51 999 999 999" value={form.phone} disabled={busy} onChange={e => {setForm({...form, phone: e.target.value}); setMessage('');}} /><small>Tu número personal de contacto.</small></div>
            </div>
            <dl className={styles.email}><Detail label="Correo de acceso" value={data.userEmail} icon={Mail} /></dl>
            <p className={styles.note}><LockKeyhole size={15} aria-hidden="true" />Para cambiar tu correo de acceso, contacta con tu responsable de cuenta.</p>
            <div className={styles.actions}><button type="submit" disabled={busy || !dirty || !form.name.trim()}>{busy ? 'Guardando…' : 'Guardar cambios'}</button><button type="button" disabled={busy || !dirty} onClick={() => {setForm(saved);setError('');setMessage('');}}>Cancelar</button></div>
            {error && <p role="alert" className={styles.error}>{error}</p>}
            <p role="status" className={styles.status}>{message}</p>
          </form>
        </section>
      </div>
      <aside className={styles.aside} aria-labelledby="company-title">
        <h2 id="company-title">Empresa</h2><p>Cuenta de cliente vinculada a tu perfil.</p>
        <dl className={styles.companyFields}><Detail label="Empresa o razón social" value={data.client?.businessName || data.client?.name} icon={Building2} /><Detail label="Dirección" value={data.client?.address} icon={MapPin} /><Detail label="Teléfono de empresa" value={data.client?.phone} icon={Phone} /></dl>
        <div className={styles.support}><p>Para modificar los datos de empresa o facturación, comunícate con tu responsable de cuenta.</p><Link href="/client/help">Ir a Ayuda <ArrowUpRight size={16} aria-hidden="true" /></Link></div>
      </aside>
    </div>
  </div>;
}
