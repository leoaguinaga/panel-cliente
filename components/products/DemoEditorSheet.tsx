'use client';

import { useState, useTransition } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { saveDemoAction } from '@/src/modules/products/server/demo-actions';
import { demoStatuses, type Demo } from '@/src/modules/products/demo-types';

type Option = { id: string; name: string };
export type DemoEditorOptions = { workers: Option[]; leads: (Option & { productId: string | null })[]; clients: Option[]; productName: string };

const field = 'mt-2 min-h-11 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring';
export function DemoEditorSheet({ productId, demo, options, children }: { productId: string; demo?: Demo; options: DemoEditorOptions; children?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState('');
  const { workers, leads, clients, productName } = options;
  // Solo leads del mismo espacio o sin espacio (al vincularlo pasa a este producto).
  const own = leads.filter(item => item.productId), free = leads.filter(item => !item.productId);
  return <Sheet open={open} onOpenChange={next => { setOpen(next); if (!next) setError(''); }}>
    <SheetTrigger asChild>{children || <Button><Plus className="size-4" />Nueva demo</Button>}</SheetTrigger>
    <SheetContent className="gap-0 p-0 sm:max-w-xl">
      <SheetHeader className="border-b px-6 py-6 pr-12"><SheetTitle className="text-xl">{demo ? demo.companyName : 'Nueva demo'}</SheetTitle><SheetDescription>{demo ? 'Actualiza el estado comercial y agenda la próxima acción.' : `Registra a quien pidió ver ${productName}. Solo la empresa es obligatoria.`}</SheetDescription></SheetHeader>
      <form className="flex min-h-0 flex-1 flex-col" action={data => start(async () => { setError(''); try { const result = await saveDemoAction(productId, demo?.id ?? null, data); if (!result.ok) { setError(result.error || 'No pudimos guardar la demo.'); return; } setOpen(false); } catch { setError('No pudimos guardar la demo. Revisa los datos y vuelve a intentarlo.'); } })}>
        <fieldset disabled={pending} className="min-h-0 flex-1 space-y-7 overflow-y-auto px-6 py-6 disabled:opacity-60">
          <section className="space-y-4"><h3 className="font-semibold">Seguimiento</h3>
            <div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm">Estado<select name="status" defaultValue={demo?.status || 'DEMO_REQUESTED'} className={field}>{Object.entries(demoStatuses).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="block text-sm">Responsable<select name="assignedToId" defaultValue={demo?.assignedToId || ''} className={field}><option value="">Sin asignar</option>{workers.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
              <label className="block text-sm">Fecha de la demo<input type="date" name="demoDate" defaultValue={demo?.demoDate?.slice(0, 10) || ''} className={field} /></label><label className="block text-sm">Próxima acción<input type="date" name="nextActionAt" defaultValue={demo?.nextActionAt?.slice(0, 10) || ''} className={field} /></label></div>
            <label className="block text-sm">Notas<textarea name="notes" maxLength={10000} rows={4} defaultValue={demo?.notes || ''} placeholder="Qué vio, qué le interesó y qué toca hacer después" className={field} /></label>
          </section>
          <section className="space-y-4 border-t pt-6"><h3 className="font-semibold">Contacto</h3>
            <label className="block text-sm">Empresa o negocio <span className="text-muted-foreground">(obligatorio)</span><input name="companyName" required maxLength={200} autoComplete="organization" defaultValue={demo?.companyName} placeholder="Hotel, restaurante o empresa" className={field} /></label>
            <label className="block text-sm">Nombre del contacto<input name="contactName" maxLength={200} autoComplete="name" defaultValue={demo?.contactName || ''} placeholder="Nombre y apellidos" className={field} /></label>
            <div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm">Correo<input type="email" name="contactEmail" maxLength={200} autoComplete="email" defaultValue={demo?.contactEmail || ''} placeholder="contacto@empresa.com" className={field} /></label><label className="block text-sm">Teléfono<input type="tel" name="contactPhone" maxLength={50} autoComplete="tel" defaultValue={demo?.contactPhone || ''} placeholder="+51" className={field} /></label></div>
          </section>
          <section className="space-y-4 border-t pt-6"><h3 className="font-semibold">Vínculos</h3>
            <div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm">Lead<select name="leadId" defaultValue={demo?.leadId || ''} className={field}><option value="">Sin vincular</option>{own.length > 0 && <optgroup label={`De ${productName}`}>{own.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</optgroup>}{free.length > 0 && <optgroup label="Sin espacio (pasa a este producto)">{free.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</optgroup>}</select></label><label className="block text-sm">Cliente<select name="clientId" defaultValue={demo?.clientId || ''} className={field}><option value="">Sin vincular</option>{clients.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label></div>
          </section>
        </fieldset>
        <footer className="space-y-3 border-t bg-background px-6 py-4">{error && <p role="alert" className="text-sm text-destructive">{error}</p>}<div className="flex justify-end gap-3"><SheetClose asChild><Button type="button" variant="outline" disabled={pending}>Cancelar</Button></SheetClose><Button type="submit" disabled={pending}>{pending ? 'Guardando…' : demo ? 'Guardar seguimiento' : 'Registrar demo'}</Button></div></footer>
      </form>
    </SheetContent>
  </Sheet>;
}
