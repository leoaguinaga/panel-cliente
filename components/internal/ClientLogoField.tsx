'use client';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ImageUp, Trash2 } from 'lucide-react';
import { ClientLogo, clientLogoSrc } from '@/components/shared/ClientLogo';

const MAX_LOGO = 2 * 1024 * 1024;
const TYPES = ['image/jpeg', 'image/png', 'image/webp'];
type LogoClient = { id: string; name: string; businessName: string | null; logoKey?: string | null };

async function errorOf(response: Response, fallback: string) {
  const body = await response.json().catch(() => null);
  return Array.isArray(body?.message) ? body.message.join('. ') : body?.message || fallback;
}

/** Logo del cliente en la cabecera de su ficha: se sube como archivo (JPG, PNG o WebP de hasta 2 MB). */
export function ClientLogoField({ client, disabled }: { client: LogoClient; disabled?: boolean }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<string | null | undefined>(undefined);
  const hasLogo = preview === undefined ? Boolean(client.logoKey) : Boolean(preview);

  async function upload(file?: File) {
    if (!file) return;
    setError('');
    if (!TYPES.includes(file.type)) { setError('Usa una imagen JPG, PNG o WebP.'); return; }
    if (file.size > MAX_LOGO) { setError('El logo pesa más de 2 MB. Elige uno más liviano.'); return; }
    setBusy(true);
    try {
      const data = new FormData();
      data.append('file', file, file.name);
      const response = await fetch(`/api/backend/clients/${encodeURIComponent(client.id)}/logo`, { method: 'POST', body: data });
      if (!response.ok) { setError(await errorOf(response, 'No se pudo subir el logo. Intenta de nuevo.')); return; }
      const updated = await response.json();
      setPreview(clientLogoSrc(updated)); toast.success('Logo actualizado.'); router.refresh();
    } catch { setError('No se pudo subir el logo. Revisa tu conexión e intenta de nuevo.'); }
    finally { setBusy(false); if (fileRef.current) fileRef.current.value = ''; }
  }

  async function remove() {
    setBusy(true); setError('');
    try {
      const response = await fetch(`/api/backend/clients/${encodeURIComponent(client.id)}/logo`, { method: 'DELETE' });
      if (!response.ok) { setError(await errorOf(response, 'No se pudo quitar el logo. Intenta de nuevo.')); return; }
      setPreview(null); toast.success('Logo eliminado.'); router.refresh();
    } catch { setError('No se pudo quitar el logo. Revisa tu conexión e intenta de nuevo.'); }
    finally { setBusy(false); }
  }

  const button = 'inline-flex min-h-9 items-center gap-1.5 rounded-md px-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50';
  return <div className="flex w-16 shrink-0 flex-col items-start gap-1.5">
    <ClientLogo client={client} src={preview} className="size-16 rounded-xl text-lg" />
    {!disabled && <div className="flex items-center whitespace-nowrap">
      <input ref={fileRef} type="file" accept={TYPES.join(',')} className="sr-only" tabIndex={-1} aria-hidden onChange={event => upload(event.target.files?.[0])} />
      <button type="button" className={button} disabled={busy} onClick={() => fileRef.current?.click()}><ImageUp className="size-3.5" />{busy ? 'Subiendo…' : hasLogo ? 'Cambiar logo' : 'Subir logo'}</button>
      {hasLogo && <button type="button" className={button} disabled={busy} onClick={remove} aria-label="Quitar logo"><Trash2 className="size-3.5" /></button>}
    </div>}
    {error && <p role="alert" className="max-w-56 text-xs text-destructive">{error}</p>}
  </div>;
}
