import { allPages } from '@/src/lib/api/pagination';
import Link from 'next/link';
import { ArrowLeft, CalendarClock, Mail, Pencil, Phone } from 'lucide-react';
import { backendFetch } from '@/src/lib/api/server';
import { requireAuth } from '@/src/lib/auth';
import { getCatalogs } from '@/src/modules/products/server/queries';
import { demoStatuses, type Demo } from '@/src/modules/products/demo-types';
import { DemoEditorSheet, type DemoEditorOptions } from '@/components/products/DemoEditorSheet';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { notFound } from 'next/navigation';

type Option = { id: string; name: string };
type LeadOption = Option & { productId: string | null };
const statusTone: Record<Demo['status'], string> = {
  DEMO_REQUESTED: 'bg-sky-400', DEMO_GIVEN: 'bg-violet-400', FOLLOW_UP: 'bg-amber-400',
  BETA_USER: 'bg-teal-400', PAYING_CUSTOMER: 'bg-emerald-400', LOST: 'bg-muted-foreground/50',
};
// Las fechas se guardan al mediodía de Lima, así que los 10 primeros caracteres son el día.
const day = (value: string) => value.slice(0, 10);
const shortDate = (value: string) => new Date(value).toLocaleDateString('es-PE', { timeZone: 'America/Lima', day: 'numeric', month: 'short' });

function NextAction({ demo, today }: { demo: Demo; today: string }) {
  if (demo.status === 'LOST' || demo.status === 'PAYING_CUSTOMER') return <span className="text-muted-foreground">—</span>;
  if (!demo.nextActionAt) return <span className="text-muted-foreground">Sin programar</span>;
  const when = day(demo.nextActionAt);
  if (when < today) return <span className="font-medium text-rose-400">Vencida · {shortDate(demo.nextActionAt)}</span>;
  if (when === today) return <span className="font-medium text-amber-400">Hoy</span>;
  return <span>{shortDate(demo.nextActionAt)}</span>;
}

export default async function DemosPage({ params, searchParams }: { params: Promise<{ productId: string }>; searchParams: Promise<{ status?: string }> }) {
  await requireAuth(['ADMIN', 'WORKER']);
  const { productId } = await params;
  const query = await searchParams;
  const status = query.status && Object.hasOwn(demoStatuses, query.status) ? query.status as Demo['status'] : '';
  const [{ products, archivedProducts }, allDemos, workers, leads, clientResult] = await Promise.all([
    getCatalogs(), backendFetch<Demo[]>(`/catalogs/products/${encodeURIComponent(productId)}/demos`),
    backendFetch<Option[]>('/directory/workers'), backendFetch<LeadOption[]>('/leads'),
    allPages<Option>('/clients'),
  ]);
  const product = [...products, ...archivedProducts].find(item => item.id === productId);
  if (!product) notFound();
  const options: DemoEditorOptions = { workers, leads: leads.filter(item => !item.productId || item.productId === productId), clients: clientResult, productName: product.name };
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' });
  const counts = allDemos.reduce<Record<string, number>>((acc, demo) => ({ ...acc, [demo.status]: (acc[demo.status] || 0) + 1 }), {});
  // Primero lo que toca atender: próxima acción más cercana, luego sin fecha.
  const demos = allDemos.filter(demo => !status || demo.status === status)
    .sort((a, b) => (a.nextActionAt ? day(a.nextActionAt) : '9999').localeCompare(b.nextActionAt ? day(b.nextActionAt) : '9999'));
  const overdue = allDemos.filter(demo => demo.nextActionAt && day(demo.nextActionAt) < today && demo.status !== 'LOST' && demo.status !== 'PAYING_CUSTOMER').length;
  const tabs = [{ value: '', label: 'Todas', count: allDemos.length }, ...Object.entries(demoStatuses).map(([value, label]) => ({ value, label, count: counts[value] || 0 }))];

  return <section className="min-w-0 space-y-6">
    <header className="space-y-3">
      <Link href="/internal/products" className="inline-flex min-h-9 items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" />Productos</Link>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1"><h1 className="text-3xl font-semibold">Demos de {product.name}</h1><p className="text-muted-foreground">{allDemos.length === 1 ? '1 demo' : `${allDemos.length} demos`}{overdue > 0 && <> · <span className="text-rose-400">{overdue === 1 ? '1 acción vencida' : `${overdue} acciones vencidas`}</span></>}</p></div>
        <DemoEditorSheet productId={productId} options={options} />
      </div>
    </header>

    <nav aria-label="Filtrar por estado" className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
      {tabs.map(tab => <Link key={tab.value} href={tab.value ? `?status=${tab.value}` : '?'} aria-current={status === tab.value ? 'page' : undefined} className={cn('inline-flex min-h-9 shrink-0 items-center gap-2 rounded-lg border px-3 text-sm transition-colors', status === tab.value ? 'border-foreground/20 bg-muted font-medium text-foreground' : 'border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground')}>{tab.value && <span aria-hidden className={cn('size-2 rounded-full', statusTone[tab.value as Demo['status']])} />}{tab.label}<span className="tabular-nums text-xs text-muted-foreground">{tab.count}</span></Link>)}
    </nav>

    {demos.length === 0 ? <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-14 text-center"><CalendarClock className="size-8 text-muted-foreground" /><p className="font-medium">{status ? `No hay demos en «${demoStatuses[status]}»` : 'Aún no hay demos'}</p><p className="max-w-sm text-sm text-muted-foreground">{status ? 'Prueba con otro estado o registra una nueva.' : `Registra a quien pidió ver ${product.name} y agenda la próxima acción.`}</p>{!status && <DemoEditorSheet productId={productId} options={options} />}</div>
    : <section aria-label="Seguimiento de demos" className="overflow-hidden rounded-xl border bg-card">
      <div className="hidden grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] gap-4 border-b px-5 py-2.5 text-xs font-medium text-muted-foreground lg:grid"><span>Empresa y contacto</span><span>Estado</span><span>Responsable</span><span>Próxima acción</span><span className="w-20" /></div>
      <ul className="divide-y">{demos.map(demo => <li key={demo.id} className="grid gap-3 px-5 py-4 lg:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-center lg:gap-4">
        <div className="min-w-0 space-y-1">
          <p className="break-words font-semibold">{demo.companyName}</p>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground">
            {demo.contactName && <span>{demo.contactName}</span>}
            {demo.contactEmail && <a href={`mailto:${demo.contactEmail}`} className="inline-flex min-w-0 items-center gap-1 hover:text-foreground"><Mail className="size-3.5 shrink-0" /><span className="truncate">{demo.contactEmail}</span></a>}
            {demo.contactPhone && <a href={`tel:${demo.contactPhone}`} className="inline-flex items-center gap-1 hover:text-foreground"><Phone className="size-3.5" />{demo.contactPhone}</a>}
            {!demo.contactName && !demo.contactEmail && !demo.contactPhone && <span>Sin datos de contacto</span>}
          </div>
          {demo.notes && <p className="line-clamp-2 whitespace-pre-wrap break-words pt-1 text-sm text-foreground/80" title={demo.notes}>{demo.notes}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm lg:contents">
          <span className="inline-flex items-center gap-2 whitespace-nowrap"><span aria-hidden className={cn('size-2 rounded-full', statusTone[demo.status])} />{demoStatuses[demo.status]}</span>
          <span className={cn(!demo.assignedTo && 'text-muted-foreground')}><span className="text-muted-foreground lg:hidden">Responsable: </span>{demo.assignedTo?.name || 'Sin asignar'}</span>
          <span><span className="text-muted-foreground lg:hidden">Próxima acción: </span><NextAction demo={demo} today={today} />{demo.demoDate && <span className="block text-xs text-muted-foreground">Demo: {shortDate(demo.demoDate)}</span>}</span>
        </div>
        <div className="lg:w-20 lg:text-right"><DemoEditorSheet productId={productId} demo={demo} options={options}><Button variant="outline" size="sm" aria-label={`Editar seguimiento de ${demo.companyName}`}><Pencil className="size-3.5" />Editar</Button></DemoEditorSheet></div>
      </li>)}</ul>
    </section>}
  </section>;
}
