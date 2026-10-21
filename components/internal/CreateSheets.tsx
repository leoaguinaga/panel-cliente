'use client';
import { runFormAction } from '@/src/lib/api/form-action';

import { useState, useTransition } from 'react';
import { createLeadAction } from '@/src/modules/leads/server/actions';
import { createProjectAction } from '@/src/modules/projects/server/actions';
import { createPaymentAction } from '@/src/modules/payments/server/actions';
import { Button } from '@/components/ui/button';
import { WorkspaceSelect } from '@/components/products/WorkspaceSelect';
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

type Worker = { id: string; name: string; email: string };
type Client = { id: string; name: string; businessName: string | null };
const field = 'mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring';

/** Con `open`/`onOpenChange` la hoja se controla desde fuera (p. ej. un menú) y no dibuja su botón. */
type SheetControl = { open?: boolean; onOpenChange?: (open: boolean) => void };

function CreateSheet({ title, description, trigger, action, children, open: controlledOpen, onOpenChange }: { title: string; description: string; trigger: string; action: (data: FormData) => Promise<unknown>; children: React.ReactNode } & SheetControl) {
  const [ownOpen, setOwnOpen] = useState(false); const [pending, startTransition] = useTransition(); const [error, setError] = useState<string | null>(null);
  const controlled = controlledOpen !== undefined; const open = controlled ? controlledOpen : ownOpen; const setOpen = controlled ? (next: boolean) => onOpenChange?.(next) : setOwnOpen;
  return <Sheet open={open} onOpenChange={setOpen}>{!controlled && <SheetTrigger asChild><Button>{trigger}</Button></SheetTrigger>}<SheetContent side="right" className="overflow-y-auto"><SheetHeader><SheetTitle>{title}</SheetTitle><SheetDescription>{description}</SheetDescription></SheetHeader><form action={(data) => startTransition(async () => { setError(null); try { const result = await runFormAction(action, data); if (!result.ok) { setError(result.error); return; } setOpen(false); } catch (cause) { setError(cause instanceof Error ? cause.message : 'No pudimos guardar los cambios'); } })} className="mt-4 space-y-4">{children}{error && <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}<div className="sticky bottom-0 flex justify-end gap-2 border-t bg-background py-4"><SheetClose asChild><Button type="button" variant="outline">Cancelar</Button></SheetClose><Button type="submit" disabled={pending}>{pending ? 'Guardando…' : trigger.replace('Nuevo ', 'Crear ').replace('Nueva ', 'Crear ').replace('Añadir ', 'Crear ')}</Button></div></form></SheetContent></Sheet>;
}

export { ClientEditorSheet as CreateClientSheet } from '@/components/internal/ClientEditorSheet';
export function CreateLeadSheet({ workers, products = [], defaultProductId, ...control }: { workers: Worker[]; products?: { id: string; name: string }[]; defaultProductId?: string | null } & SheetControl) {
  return (
    <CreateSheet
      {...control}
      title="Nuevo prospecto / Lead"
      description="Registra un prospecto identificado en zona para el flujo de desarrollo autónomo o solicitud entrante."
      trigger="Nuevo prospecto"
      action={createLeadAction}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-xs font-semibold text-slate-700">
          Nombre del Negocio / Empresa
          <input required name="companyName" placeholder="Ej. Restaurante La Huerta" className={field} />
        </label>
        <label className="block text-xs font-semibold text-slate-700">
          Persona de Contacto
          <input name="name" placeholder="Ej. Carlos Mendoza (Dueño)" className={field} />
        </label>
      </div>

      {products.length > 0 && <WorkspaceSelect products={products} defaultValue={defaultProductId} className={field} labelClassName="block text-xs font-semibold text-slate-700" />}

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-xs font-semibold text-slate-700">
          Zona / Territorio Mapeado
          <input name="zone" placeholder="Ej. Miraflores - Zona Gastronómica" className={field} />
        </label>
        <label className="block text-xs font-semibold text-slate-700">
          Prioridad Comercial
          <select name="priority" defaultValue="MEDIUM" className={field}>
            <option value="LOW">Baja</option>
            <option value="MEDIUM">Media</option>
            <option value="HIGH">Alta</option>
            <option value="URGENT">Urgente</option>
          </select>
        </label>
      </div>

      <label className="block text-xs font-semibold text-slate-700">
        URL de la Maqueta / Demo Web
        <input name="previewUrl" placeholder="https://demo-restaurante.vercel.app" className={field} />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-xs font-semibold text-slate-700">
          Teléfono / WhatsApp
          <input name="phone" type="tel" placeholder="+51 999 888 777" className={field} />
        </label>
        <label className="block text-xs font-semibold text-slate-700">
          Correo Electrónico
          <input name="email" type="email" placeholder="contacto@negocio.com" className={field} />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-xs font-semibold text-slate-700">
          Estado Inicial
          <select name="status" defaultValue="MAPPED" className={field}>
            <option value="MAPPED">1. Mapeo en Zona</option>
            <option value="SITE_DEVELOPMENT">2. En Desarrollo Autónomo</option>
            <option value="PRESENTED">3. Contactado / Presentado</option>
            <option value="FEEDBACK_CHANGES">4. En Negociación / Cambios</option>
            <option value="WON">5. Aceptado / Ganado</option>
            <option value="LOST">6. Rechazado / Perdido</option>
          </select>
        </label>
        <label className="block text-xs font-semibold text-slate-700">
          Responsable Asignado
          <select name="assignedToId" className={field}>
            <option value="">Sin asignar</option>
            {workers.map((worker) => (
              <option key={worker.id} value={worker.id}>
                {worker.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block text-xs font-semibold text-slate-700">
        Notas de Prospección
        <textarea name="message" rows={3} placeholder="Observaciones de la zona, competidores, etc." className={field} />
      </label>
    </CreateSheet>
  );
}

export function CreateProjectSheet({ clients, ...control }: { clients: Client[] } & SheetControl) { return <CreateSheet {...control} title="Nuevo proyecto" description="Crea el contexto mínimo para comenzar a operarlo." trigger="Nuevo proyecto" action={createProjectAction}><label className="block text-sm font-medium">Nombre<input required name="name" placeholder="Ej. Sitio web Restaurante X" className={field} /></label><label className="block text-sm font-medium">Cliente<select required name="clientId" className={field}><option value="">Selecciona un cliente</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.businessName || client.name}</option>)}</select></label><label className="block text-sm font-medium">Tipo<select name="type" className={field}><option value="WEBSITE">Sitio web</option><option value="SYSTEM">Software a medida</option><option value="APP">Aplicación</option><option value="MAINTENANCE">Mantenimiento</option></select></label><label className="block text-sm font-medium">Descripción<textarea name="description" rows={4} className={field} /></label></CreateSheet>; }

export function CreatePaymentSheet({ clients, projects }: { clients: Client[]; projects: { id: string; name: string; client: { id: string } }[] }) {
  const [clientId, setClientId] = useState('');
  const clientProjects = projects.filter((project) => project.client.id === clientId);
  return <CreateSheet title="Nueva cuota" description="Para cuotas sueltas. Las de un proyecto se arman mejor desde sus condiciones de pago, atadas a sus hitos." trigger="Nueva cuota" action={createPaymentAction}><label className="block text-sm font-medium">Cliente<select required name="clientId" value={clientId} onChange={(event) => setClientId(event.target.value)} className={field}><option value="">Selecciona un cliente</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.businessName || client.name}</option>)}</select></label><label className="block text-sm font-medium">Proyecto<select name="projectId" disabled={!clientId} className={field}><option value="">{clientId && !clientProjects.length ? 'Este cliente no tiene proyectos' : 'Sin proyecto'}</option>{clientProjects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label><label className="block text-sm font-medium">Concepto<input required name="concept" placeholder="Ej. Mensualidad noviembre" className={field} /></label><div className="grid grid-cols-[1fr_7rem] gap-3"><label className="block text-sm font-medium">Monto<input required name="amount" type="number" min="0.01" step="0.01" inputMode="decimal" className={field} /></label><label className="block text-sm font-medium">Moneda<select name="currency" defaultValue="USD" className={field}><option value="USD">USD</option><option value="PEN">PEN</option></select></label></div><label className="block text-sm font-medium">Vence el<input name="dueDate" type="date" className={field} /><span className="mt-1 block text-xs font-normal text-muted-foreground">Sin fecha, la cuota aparece en «Sin fecha» hasta que se la pongas.</span></label></CreateSheet>;
}
