'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { StatusBadge } from '@/components/shared/StatusBadge';
import type { ClientUser } from '@/src/lib/api/contracts';

const field = 'mt-2 min-h-11 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring';
export function ClientUsers({ clientId, users, isAdmin, archived }: { clientId: string; users: ClientUser[]; isAdmin: boolean; archived: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  async function send(path: string, method: string, body?: unknown) {
    setPending(true); setError(''); setMessage('');
    try {
      const response = await fetch(`/api/backend/clients/${clientId}/users${path}`, { method, headers: { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
      const data = await response.json();
      if (!response.ok) throw new Error(Array.isArray(data.message) ? data.message.join('. ') : data.message || data.error || 'No se pudo completar la acción.');
      setMessage(method === 'PATCH' ? 'Estado de acceso actualizado.' : 'Correo enviado. El enlace vence en una hora.');
      setOpen(false);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo completar la acción.'); }
    finally { setPending(false); router.refresh(); }
  }
  return <section className="overflow-hidden rounded-xl border bg-card">
    <header className="flex flex-wrap items-start justify-between gap-4 border-b p-5"><div><h2 className="font-semibold">Usuarios del cliente</h2><p className="mt-1 max-w-prose text-sm text-muted-foreground">Cada persona tiene su propio acceso a los proyectos, documentos y pagos de este cliente.</p></div>
      {isAdmin && !archived && <Sheet open={open} onOpenChange={setOpen}><SheetTrigger asChild><Button>Invitar usuario</Button></SheetTrigger><SheetContent className="gap-0 p-0 sm:max-w-xl"><SheetHeader className="border-b p-6"><SheetTitle>Invitar usuario</SheetTitle><SheetDescription>Recibirá un correo para crear su contraseña. El enlace vence en una hora.</SheetDescription></SheetHeader><form className="flex min-h-0 flex-1 flex-col" onSubmit={event => { event.preventDefault(); const data = new FormData(event.currentTarget); void send('', 'POST', { name: data.get('name'), email: data.get('email') }); }}><fieldset disabled={pending} className="flex-1 space-y-5 overflow-y-auto p-6"><label className="block text-sm">Nombre<input name="name" required maxLength={200} autoComplete="name" className={field} /></label><label className="block text-sm">Correo electrónico<input name="email" type="email" required maxLength={254} autoComplete="email" className={field} /></label><p className="text-sm text-muted-foreground">Podrá consultar la información visible del cliente en el portal. No tendrá acceso al panel interno.</p></fieldset><footer className="space-y-3 border-t p-6">{error && <p role="alert" className="text-sm text-destructive">{error}</p>}<div className="flex justify-end gap-3"><Button type="button" variant="outline" disabled={pending} onClick={() => setOpen(false)}>Cancelar</Button><Button type="submit" disabled={pending}>{pending ? 'Enviando…' : 'Enviar invitación'}</Button></div></footer></form></SheetContent></Sheet>}
    </header>
    {archived && <p className="px-5 pt-4 text-sm text-muted-foreground">Reactiva el cliente para enviar invitaciones o enlaces de contraseña.</p>}
    {!isAdmin && <p className="px-5 pt-4 text-sm text-muted-foreground">Solo los administradores pueden gestionar accesos.</p>}
    <div aria-live="polite" className="px-5">{message && <p className="py-3 text-sm">{message}</p>}{error && !open && <p role="alert" className="py-3 text-sm text-destructive">{error}</p>}</div>
    {!users.length ? <p className="px-5 py-8 text-sm text-muted-foreground">Todavía no hay usuarios. Invita a una persona para darle acceso al portal.</p> : <ul className="divide-y">{users.map(user => <li key={user.id} className="flex flex-wrap items-center justify-between gap-4 p-5"><div className="min-w-0"><p className="break-words font-medium">{user.name}</p><p className="mt-1 break-all text-sm text-muted-foreground">{user.email}</p><div className="mt-2"><StatusBadge status={user.status} /></div></div>{isAdmin && <div className="flex flex-wrap gap-2">{user.status !== 'INACTIVE' && !archived && <Button variant="outline" disabled={pending} onClick={() => void send(`/${user.id}/password-email`, 'POST')}>{user.status === 'INVITED' ? 'Reenviar invitación' : 'Restablecer contraseña'}</Button>}<Button variant="ghost" disabled={pending || (archived && user.status === 'INACTIVE')} onClick={() => void send(`/${user.id}/status`, 'PATCH', { active: user.status === 'INACTIVE' })}>{user.status === 'INACTIVE' ? 'Activar acceso' : 'Desactivar acceso'}</Button></div>}</li>)}</ul>}
  </section>;
}
