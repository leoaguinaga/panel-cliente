'use client';

import { useState, useTransition } from 'react';
import { Plus, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ClientDuplicateCheck } from './ClientDuplicateCheck';
import { saveClientAction } from '@/src/modules/clients/server/actions';
import { formatClientStatus } from '@/lib/formatters';
import type { Client } from '@/src/lib/api/contracts';

const field = 'mt-2 min-h-11 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring';
export function ClientEditorSheet({ client, workers = [] }: { client?: Client; workers?: { id: string; name: string }[] }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState('');
  const editing = Boolean(client);
  return <Sheet open={open} onOpenChange={next => { setOpen(next); if (!next) setError(''); }}>
    <SheetTrigger asChild><Button variant={editing ? 'outline' : 'default'}>{editing ? <Pencil className="size-4" /> : <Plus className="size-4" />}{editing ? 'Editar cliente' : 'Nuevo cliente'}</Button></SheetTrigger>
    <SheetContent className="gap-0 p-0 sm:max-w-xl">
      <SheetHeader className="border-b px-6 py-6 pr-12"><SheetTitle className="text-xl">{editing ? 'Editar cliente' : 'Nuevo cliente'}</SheetTitle><SheetDescription>{editing ? 'Actualiza los datos de contacto y la relación con tu equipo.' : 'Añade el contacto y los datos de su empresa. Solo el nombre es obligatorio.'}</SheetDescription></SheetHeader>
      <form className="flex min-h-0 flex-1 flex-col" action={data => start(async () => { setError(''); try { const result = await saveClientAction(client?.id ?? null, data); if (!result.ok) { setError(result.error || 'No pudimos guardar el cliente.'); return; } setOpen(false); } catch { setError('No pudimos guardar el cliente. Revisa los datos y vuelve a intentarlo.'); } })}>
        <fieldset disabled={pending} className="min-h-0 flex-1 space-y-7 overflow-y-auto px-6 py-6 disabled:opacity-60">
          <section className="space-y-4"><h3 className="font-semibold">Contacto principal</h3><label className="block text-sm">Nombre del contacto <span className="text-muted-foreground">(obligatorio)</span><input required name="name" autoComplete="name" defaultValue={client?.name} placeholder="Nombre y apellidos" className={field} /></label><label className="block text-sm">Correo electrónico<input name="email" type="email" autoComplete="email" defaultValue={client?.email || ''} placeholder="contacto@empresa.com" className={field} /></label><div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm">Teléfono<input name="phone" type="tel" autoComplete="tel" defaultValue={client?.phone || ''} placeholder="+51" className={field} /></label><label className="block text-sm">WhatsApp<input name="whatsapp" type="tel" defaultValue={client?.whatsapp || ''} placeholder="+51" className={field} /></label></div></section>
          <section className="space-y-4 border-t pt-6"><h3 className="font-semibold">Empresa y facturación</h3><label className="block text-sm">Empresa o razón social<input name="businessName" autoComplete="organization" defaultValue={client?.businessName || ''} placeholder="Nombre de la empresa" className={field} /></label><label className="block text-sm">Número de documento<input name="documentNumber" defaultValue={client?.documentNumber || ''} placeholder="RUC, DNI u otro documento" className={field} /></label></section>
          {client && <section className="space-y-4 border-t pt-6"><h3 className="font-semibold">Gestión del cliente</h3><div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm">Estado<select name="status" defaultValue={client.status} className={field}>{['PROSPECT', 'ACTIVE', 'INACTIVE', 'ARCHIVED'].map(status => <option key={status} value={status}>{formatClientStatus(status)}</option>)}</select></label><label className="block text-sm">Responsable<select name="responsibleWorkerId" defaultValue={client.responsibleWorkerId || ''} className={field}><option value="">Sin asignar</option>{workers.map(worker => <option key={worker.id} value={worker.id}>{worker.name}</option>)}</select></label></div></section>}
          {!client && <div className="border-t pt-5"><ClientDuplicateCheck /></div>}
        </fieldset>
        <footer className="space-y-3 border-t bg-background px-6 py-4">{error && <p role="alert" className="text-sm text-destructive">{error}</p>}<div className="flex justify-end gap-3"><SheetClose asChild><Button type="button" variant="outline" disabled={pending}>Cancelar</Button></SheetClose><Button type="submit" disabled={pending}>{pending ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear cliente'}</Button></div></footer>
      </form>
    </SheetContent>
  </Sheet>;
}
