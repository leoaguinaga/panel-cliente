'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import type { Connection } from '../calendar/types';
import styles from './settings.module.css';
async function googleApi<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch('/api/backend/calendar/google' + path, { ...init, headers: { 'Content-Type': 'application/json' }, cache: 'no-store' });
  const data = await response.json();
  if (!response.ok) throw new Error(Array.isArray(data.message) ? data.message.join('. ') : data.message || 'No fue posible completar la operación con Google.');
  return data;
}
export function GoogleIntegration() {
  const [connection, setConnection] = useState<Connection>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState(false);
  const started = useRef(false);
  const load = useCallback(async () => { setConnection(await googleApi<Connection>('/status')); }, []);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const url = new URL(window.location.href);
    const code = url.searchParams.get('code'), state = url.searchParams.get('state');
    const callback = url.searchParams.has('code') || url.searchParams.has('error');
    if (callback) window.history.replaceState({}, '', url.pathname + '?section=integraciones');
    async function initialize() {
      if (callback) {
        setBusy(true);
        try {
          if (!code || !state) throw new Error('Google no autorizó la conexión. Vuelve a intentarlo.');
          await googleApi('/callback', { method: 'POST', body: JSON.stringify({ code, state }) });
          toast.success('Google Calendar conectado.');
        } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo conectar Google.'); }
        finally { setBusy(false); }
      }
      await load();
    }
    void initialize().catch(e => setError(e.message));
  }, [load]);
  async function connect() {
    setError(''); setBusy(true);
    try { const { url } = await googleApi<{ url: string }>('/authorize', { method: 'POST' }); window.location.assign(url); }
    catch (e) { setError(e instanceof Error ? e.message : 'No se pudo abrir Google.'); setBusy(false); }
  }
  async function disconnect() {
    setBusy(true); setError('');
    try { await googleApi('', { method: 'DELETE' }); await load(); setConfirm(false); toast.success('Google desconectado.', { description: 'Las reuniones guardadas se conservan.' }); }
    catch (e) { setError(e instanceof Error ? e.message : 'No se pudo desconectar Google.'); }
    finally { setBusy(false); }
  }
  return <><div className={styles.intro}><h2>Integraciones</h2><p>Conecta las herramientas que usa tu equipo.</p></div>
    {error && <div role="alert" className={`${styles.message} ${styles.error}`}>{error} {!connection && <Button variant="outline" onClick={() => { setError(''); void load().catch(e => setError(e.message)); }}>Reintentar</Button>}</div>}
    <article className={styles.integration}><header className={styles.integrationHead}><div><h3>Google Calendar y Meet</h3><p className={styles.note} style={{ marginTop: 4 }}>La cuenta organizadora de Foxcode.</p></div><span className={styles.status}>{!connection ? 'Consultando estado…' : connection.connected ? 'Conectado' : connection.configured ? 'Listo para conectar' : 'Requiere preparación'}</span></header>
    <div className={styles.integrationBody}><p className={styles.note} style={{ marginTop: 0, marginBottom: 22 }}>Invitaciones por correo · Enlaces de Google Meet</p><div className={styles.state}>
      <h4>{!connection ? 'Comprobando la conexión' : connection.connected ? 'Cuenta organizadora conectada' : connection.configured ? 'Elige la cuenta organizadora' : 'Falta preparar la conexión'}</h4>
      <p>{!connection ? 'Espera mientras consultamos el estado de Google.' : connection.connected ? connection.email : connection.configured ? 'Continúa con Google para autorizar a Foxcode a crear reuniones, enviar invitaciones y generar enlaces de Meet.' : 'El equipo técnico debe habilitar la integración de Google. Cuando esté lista, podrás conectar la cuenta que organizará las reuniones.'}</p>
      <div className="flex flex-wrap gap-3"><Button disabled={!connection?.configured || busy} onClick={() => void connect()}>{busy ? 'Procesando…' : connection?.connected ? 'Reconectar Google' : 'Conectar Google'}</Button>{connection?.connected && <Button variant="outline" disabled={busy} onClick={() => setConfirm(true)}>Desconectar</Button>}</div>
      {connection && !connection.configured && <details><summary>Qué necesita el equipo técnico</summary><ol><li>Configurar las credenciales OAuth en el servidor.</li><li>Habilitar Calendar y registrar la URL de retorno.</li><li>Verificar el acceso de la cuenta organizadora.</li></ol></details>}
      {confirm && <div className="mt-6" role="group" aria-label="Confirmar desconexión"><h4>¿Desconectar Google?</h4><p>Las reuniones guardadas se conservan. Las nuevas reuniones no generarán invitaciones ni enlaces de Meet desde esta conexión.</p><div className="flex flex-wrap gap-3"><Button variant="destructive" disabled={busy} onClick={() => void disconnect()}>Sí, desconectar</Button><Button variant="outline" disabled={busy} onClick={() => setConfirm(false)}>Cancelar</Button></div></div>}
    </div></div><footer className={styles.integrationFoot}>Las reuniones se gestionan desde Foxcode. Los cambios hechos en Google todavía no se importan.</footer></article><p className={styles.note}>La conexión la administra un usuario con rol administrador. Puedes guardar reuniones y recordatorios aunque Google aún no esté conectado.</p></>;
}
