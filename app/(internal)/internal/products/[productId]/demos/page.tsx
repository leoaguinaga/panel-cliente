import { allPages } from '@/src/lib/api/pagination';
import Link from 'next/link';
import { backendFetch } from '@/src/lib/api/server';
import { requireAuth } from '@/src/lib/auth';
import { getCatalogs } from '@/src/modules/products/server/queries';
import { demoStatuses, type Demo } from '@/src/modules/products/demo-types';
import { saveDemoAction } from '@/src/modules/products/server/demo-actions';
import { ActionForm } from '@/components/shared/ActionForm';
import { notFound } from 'next/navigation';

type Option = { id: string; name: string };
type LeadOption = Option & { productId: string | null };
const field = 'mt-1 min-h-11 w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring';
function DemoFields({ demo, workers, leads, clients, productName }: { demo?: Demo; workers: Option[]; leads: LeadOption[]; clients: Option[]; productName: string }) {
  // Solo leads del mismo espacio o sin espacio (al vincularlo pasa a este producto).
  const own = leads.filter(item => item.productId), free = leads.filter(item => !item.productId);
  return <>
    <label>Empresa o negocio *<input name="companyName" required maxLength={200} defaultValue={demo?.companyName} className={field} /></label>
    <label>Estado<select name="status" defaultValue={demo?.status || 'DEMO_REQUESTED'} className={field}>{Object.entries(demoStatuses).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
    <label>Contacto<input name="contactName" maxLength={200} defaultValue={demo?.contactName || ''} className={field} /></label>
    <label>Correo<input type="email" name="contactEmail" maxLength={200} defaultValue={demo?.contactEmail || ''} className={field} /></label>
    <label>Teléfono<input type="tel" name="contactPhone" maxLength={50} defaultValue={demo?.contactPhone || ''} className={field} /></label>
    <label>Responsable<select name="assignedToId" defaultValue={demo?.assignedToId || ''} className={field}><option value="">Sin asignar</option>{workers.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
    <label>Fecha de demo<input type="date" name="demoDate" defaultValue={demo?.demoDate?.slice(0, 10) || ''} className={field} /></label>
    <label>Próxima acción<input type="date" name="nextActionAt" defaultValue={demo?.nextActionAt?.slice(0, 10) || ''} className={field} /></label>
    <label>Lead relacionado<select name="leadId" defaultValue={demo?.leadId || ''} className={field}><option value="">Sin vincular</option>{own.length > 0 && <optgroup label={`De ${productName}`}>{own.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</optgroup>}{free.length > 0 && <optgroup label="Sin espacio (pasa a este producto)">{free.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</optgroup>}</select></label>
    <label>Cliente relacionado<select name="clientId" defaultValue={demo?.clientId || ''} className={field}><option value="">Sin vincular</option>{clients.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
    <label className="sm:col-span-2">Notas y próxima acción<textarea name="notes" maxLength={10000} defaultValue={demo?.notes || ''} className={field} rows={3} /></label>
    <button className="min-h-11 w-fit rounded-md bg-primary px-4 py-2 text-primary-foreground">{demo ? 'Guardar seguimiento' : 'Registrar demo'}</button>
  </>;
}
export default async function DemosPage({ params, searchParams }: { params: Promise<{ productId: string }>; searchParams: Promise<{ status?: string }> }) {
  await requireAuth(['ADMIN', 'WORKER']);
  const { productId } = await params;
  const query = await searchParams;
  const status = query.status && Object.hasOwn(demoStatuses, query.status) ? query.status : '';
  const [{ products, archivedProducts }, demos, workers, leads, clientResult] = await Promise.all([
    getCatalogs(), backendFetch<Demo[]>(`/catalogs/products/${encodeURIComponent(productId)}/demos${status ? `?status=${status}` : ''}`),
    backendFetch<Option[]>('/directory/workers'), backendFetch<LeadOption[]>('/leads'),
    allPages<Option>('/clients'),
  ]);
  const product = [...products, ...archivedProducts].find(item => item.id === productId);
  if (!product) notFound();
  const options = { workers, leads: leads.filter(item => !item.productId || item.productId === productId), clients: clientResult, productName: product.name };
  return <section className="min-w-0 space-y-6">
    <header className="space-y-2"><Link href="/internal/products" className="inline-flex min-h-11 items-center text-sm underline underline-offset-4">Volver a productos</Link><h1 className="text-3xl font-semibold">Demos de {product.name}</h1><p className="text-muted-foreground">Registra el contacto, su estado comercial y la próxima acción.</p></header>
    <form className="flex flex-wrap items-end gap-3"><label>Filtrar por estado<select name="status" defaultValue={status} className={field}><option value="">Todos</option>{Object.entries(demoStatuses).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><button className="min-h-11 rounded-md border px-4 py-2">Aplicar filtro</button></form>
    <section aria-label="Seguimiento de demos" className="divide-y rounded-xl border bg-card">
      {!demos.length && <p className="p-5 text-muted-foreground">No hay demos para este filtro. Registra la primera abajo.</p>}
      {demos.map(demo => <article key={demo.id} className="min-w-0 space-y-3 p-5"><div className="flex flex-wrap items-start justify-between gap-3"><h2 className="break-words text-lg font-semibold">{demo.companyName}</h2><span className="rounded-md bg-muted px-2 py-1 text-sm">{demoStatuses[demo.status]}</span></div><p className="text-sm text-muted-foreground">Responsable: {demo.assignedTo?.name || 'Sin asignar'} · Próxima acción: {demo.nextActionAt ? new Date(demo.nextActionAt).toLocaleDateString('es-PE', { timeZone: 'America/Lima' }) : 'Sin programar'}</p>{demo.notes && <p className="whitespace-pre-wrap break-words text-sm">{demo.notes}</p>}<details><summary className="flex min-h-11 cursor-pointer items-center text-sm font-medium underline underline-offset-4">Editar seguimiento de {demo.companyName}</summary><ActionForm action={saveDemoAction.bind(null, productId, demo.id)} className="mt-4 grid gap-4 text-sm sm:grid-cols-2"><DemoFields demo={demo} {...options} /></ActionForm></details></article>)}
    </section>
    <section className="space-y-4"><h2 className="text-xl font-semibold">Nueva demo</h2><ActionForm action={saveDemoAction.bind(null, productId, null)} className="grid gap-4 rounded-xl border bg-card p-5 text-sm sm:grid-cols-2"><DemoFields {...options} /></ActionForm></section>
  </section>;
}
