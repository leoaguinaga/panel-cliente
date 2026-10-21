'use client';

import Link from 'next/link';
import { useId, useRef, useState, useTransition } from 'react';
import { Archive, ChevronRight, Info, MoreHorizontal, Pencil, Plus, Presentation } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { WorkspaceMark } from '@/components/products/WorkspaceMark';
import { DemoApiSection } from '@/components/products/DemoApiSection';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import type { CatalogProduct, ProductPulse } from '@/src/modules/products/server/queries';
import { archiveProductAction, createProductAction, restoreProductAction, updateProductAction } from '@/src/modules/products/server/actions';
import { DEFAULT_WORKSPACE_COLOR, WORKSPACE_COLORS, slugify } from '@/src/modules/products/workspace';

type Editable = Pick<ProductPulse, 'id' | 'name' | 'slug' | 'description' | 'status' | 'color' | 'logoUrl'>;
type Notice = { text: string; undoId?: string } | null;

const dayFormat = new Intl.DateTimeFormat('es-PE', { weekday: 'short', day: 'numeric', timeZone: 'America/Lima' });
const nextDemoLabel = (iso: string | null) => (iso ? `próxima ${dayFormat.format(new Date(iso)).replace('.', '')}` : '');

/** Lista de espacios con su pulso; crear, editar y archivar viven en una hoja lateral. */
export function WorkspacesView({ products, archived, isAdmin }: { products: ProductPulse[]; archived: CatalogProduct[]; isAdmin: boolean }) {
  // `nonce` reinicia el formulario en cada apertura sin cortar la animación de cierre.
  const [sheet, setSheet] = useState<{ open: boolean; product: Editable | null; confirmArchive?: boolean; nonce: number }>({ open: false, product: null, nonce: 0 });
  const [notice, setNotice] = useState<Notice>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [pending, start] = useTransition();
  const showReceivable = products.some((product) => product.receivable !== null);

  const openSheet = (product: Editable | null, confirmArchive = false) => setSheet((value) => ({ open: true, product, confirmArchive, nonce: value.nonce + 1 }));
  const restore = (id: string, name: string) =>
    start(async () => {
      const result = await restoreProductAction(id);
      setNotice({ text: result.ok ? `${name} volvió a la lista` : result.error });
    });

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-semibold tracking-tight">Productos</h1>
          <p className="mt-1 text-sm text-muted-foreground">Cada producto es un espacio de trabajo con sus propios leads, demos y proyectos. Los clientes se comparten entre espacios.</p>
        </div>
        {isAdmin && <Button onClick={() => openSheet(null)}><Plus aria-hidden />Nuevo espacio</Button>}
      </header>

      {notice && (
        <div role="status" className="flex items-center justify-between gap-4 rounded-lg border bg-card px-4 py-2.5 text-sm">
          <span>{notice.text}</span>
          {notice.undoId && <button type="button" disabled={pending} onClick={() => { const id = notice.undoId!; start(async () => { const result = await restoreProductAction(id); setNotice({ text: result.ok ? 'Se deshizo el archivo' : result.error }); }); }} className="font-semibold text-brand underline-offset-4 hover:underline">Deshacer</button>}
        </div>
      )}

      {products.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center">
          <h2 className="font-semibold">Todavía no hay espacios</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">Crea uno por cada producto propio. Sus leads, demos y proyectos quedarán separados de los servicios de FoxCode.</p>
          {isAdmin && <Button className="mt-4" onClick={() => openSheet(null)}><Plus aria-hidden />Nuevo espacio</Button>}
        </div>
      ) : (
        <div className="@container rounded-xl border bg-card">
          <div role="table" aria-label="Espacios de trabajo" className="text-sm">
            <div role="row" className={cn('hidden h-[38px] items-center gap-3 border-b pl-4 pr-3.5 text-xs text-muted-foreground @[720px]:grid', grid(showReceivable))}>
              <span role="columnheader">Espacio</span>
              <span role="columnheader" className="text-right">Leads activos</span>
              <span role="columnheader" className="text-right">Demos</span>
              <span role="columnheader" className="text-right">Proyectos</span>
              {showReceivable && <span role="columnheader" className="text-right">Por cobrar</span>}
              <span role="columnheader"><span className="sr-only">Acciones</span></span>
            </div>
            {products.map((product, index) => (
              <WorkspaceRow key={product.id} product={product} first={index === 0} showReceivable={showReceivable} isAdmin={isAdmin} onEdit={(confirmArchive) => openSheet(product, confirmArchive)} />
            ))}
          </div>
        </div>
      )}

      {isAdmin && archived.length > 0 && (
        <div>
          <button type="button" aria-expanded={showArchived} aria-controls="archived-workspaces" onClick={() => setShowArchived((value) => !value)} className="flex min-h-10 items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            <ChevronRight aria-hidden className={cn('size-4 transition-transform duration-150', showArchived && 'rotate-90')} />Archivados ({archived.length})
          </button>
          {showArchived && (
            <ul id="archived-workspaces" className="mt-2 divide-y rounded-xl border border-dashed">
              {archived.map((product) => (
                <li key={product.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                  <WorkspaceMark name={product.name} color={product.color} logoUrl={product.logoUrl} size="sm" muted />
                  <span className="min-w-0 flex-1 truncate text-muted-foreground">{product.name} · {product._count.projects} {product._count.projects === 1 ? 'proyecto' : 'proyectos'}, {product._count.demos} {product._count.demos === 1 ? 'demo' : 'demos'}</span>
                  <Button size="sm" variant="outline" disabled={pending} onClick={() => restore(product.id, product.name)}>Restaurar</Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <p className="flex items-center gap-2 text-xs text-muted-foreground"><Info aria-hidden className="size-3.5 shrink-0" />FoxCode, el espacio de servicios a medida, no se edita ni se archiva desde aquí.</p>

      {isAdmin && (
        <WorkspaceSheet
          key={sheet.nonce}
          open={sheet.open}
          product={sheet.product}
          confirmArchive={sheet.confirmArchive}
          suggestedColor={WORKSPACE_COLORS[products.length % WORKSPACE_COLORS.length].value}
          onOpenChange={(open) => setSheet((value) => ({ ...value, open }))}
          onDone={setNotice}
        />
      )}
    </section>
  );
}

const grid = (receivable: boolean) =>
  receivable
    ? '@[720px]:grid-cols-[minmax(180px,1.6fr)_repeat(4,minmax(72px,0.7fr))_32px]'
    : '@[720px]:grid-cols-[minmax(180px,1.6fr)_repeat(3,minmax(72px,0.7fr))_32px]';

function WorkspaceRow({ product, first, showReceivable, isAdmin, onEdit }: { product: ProductPulse; first: boolean; showReceivable: boolean; isAdmin: boolean; onEdit: (confirmArchive: boolean) => void }) {
  const href = `/internal/products/${product.id}/demos`;
  const [primary, ...others] = product.receivable ?? [];
  const metrics: Metric[] = [
    { label: 'Leads activos', value: product.leads.active, note: product.leads.unassigned ? `${product.leads.unassigned} sin responsable` : '', warn: product.leads.unassigned > 0 },
    { label: 'Demos', value: product.demos.open, note: nextDemoLabel(product.demos.next) },
    { label: 'Proyectos', value: product.projects.active, note: product.projects.active ? 'en curso' : '' },
    ...(showReceivable
      ? [{ label: 'Por cobrar', value: primary ? formatCurrency(primary.amount, primary.currency) : '—', note: primary ? (others.length ? `+ ${others.map((item) => formatCurrency(item.amount, item.currency)).join(', ')}` : `${primary.count} ${primary.count === 1 ? 'pendiente' : 'pendientes'}`) : '' }]
      : []),
  ];
  return (
    <div
      role="row"
      className={cn(
        'group relative grid grid-cols-[1fr_1fr_32px] items-center gap-x-4 gap-y-3 px-3.5 py-3.5 transition-colors hover:bg-foreground/[0.025] @[460px]:grid-cols-[repeat(4,1fr)_32px] @[720px]:min-h-[76px] @[720px]:gap-x-3 @[720px]:py-0 @[720px]:pl-4',
        grid(showReceivable),
        !first && 'border-t',
      )}
    >
      <div role="cell" className="col-span-2 flex min-w-0 items-center gap-3 @[460px]:col-span-4 @[720px]:col-span-1">
        <WorkspaceMark name={product.name} color={product.color} logoUrl={product.logoUrl} />
        <div className="min-w-0">
          <Link href={href} className="text-[15px] font-semibold text-foreground decoration-foreground/35 underline-offset-[3px] after:absolute after:inset-0 hover:underline focus-visible:outline-none focus-visible:after:rounded-[inherit] focus-visible:after:ring-2 focus-visible:after:ring-ring">
            {product.name}
          </Link>
          {product.status === 'PILOT' && <span className="ml-2 inline-flex items-center gap-1.5 rounded-full border px-2 align-[2px] text-[11px] font-semibold leading-[18px] text-muted-foreground"><span aria-hidden className="size-1.5 rounded-full bg-amber-700" />Piloto</span>}
          <p className="truncate text-[12.5px] text-muted-foreground">{product.description || 'Sin descripción'}</p>
        </div>
      </div>
      {metrics.map((metric, index) => (
        <MetricCell key={metric.label} metric={metric} className={cn(index % 2 === 0 ? 'col-start-1' : 'col-start-2', '@[460px]:col-start-auto')} />
      ))}
      <div role="cell" className="relative z-10 col-start-3 row-start-1 justify-self-end @[460px]:col-start-5 @[720px]:col-start-auto @[720px]:row-start-auto">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label={`Acciones de ${product.name}`} className="text-muted-foreground"><MoreHorizontal aria-hidden /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem asChild><Link href={`/internal/products/${product.id}/demos`}><Presentation aria-hidden />Ver demos</Link></DropdownMenuItem>
            {isAdmin && (
              <>
                <DropdownMenuItem onSelect={() => onEdit(false)}><Pencil aria-hidden />Editar identidad</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => onEdit(true)} className="text-destructive focus:text-destructive"><Archive aria-hidden />Archivar…</DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

type Metric = { label: string; value: number | string; note: string; warn?: boolean };

function MetricCell({ metric, className }: { metric: Metric; className?: string }) {
  const empty = metric.value === 0 || metric.value === '—';
  return (
    <div role="cell" className={cn('flex items-baseline justify-between gap-2 @[460px]:block @[720px]:text-right', className)}>
      <span className="whitespace-nowrap text-xs text-muted-foreground @[720px]:sr-only">{metric.label}</span>
      <span className={cn('whitespace-nowrap text-base font-semibold tabular-nums @[460px]:block @[720px]:text-[17px]', empty && 'font-medium text-muted-foreground')}>{metric.value}</span>
      <span className={cn('hidden min-h-[1lh] whitespace-nowrap text-[11.5px] @[720px]:block', metric.warn ? 'text-amber-800' : 'text-muted-foreground')}>{metric.note}</span>
    </div>
  );
}

const input = 'h-9 w-full rounded-md border border-input bg-card px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground/80 focus-visible:ring-2 focus-visible:ring-ring';

function WorkspaceSheet({ open, product, confirmArchive, suggestedColor, onOpenChange, onDone }: { open: boolean; product: Editable | null; confirmArchive?: boolean; suggestedColor: string; onOpenChange: (open: boolean) => void; onDone: (notice: Notice) => void }) {
  const ids = useId();
  const [name, setName] = useState(product?.name ?? '');
  const [slug, setSlug] = useState(product?.slug ?? '');
  const [slugTouched, setSlugTouched] = useState(Boolean(product));
  const [color, setColor] = useState(product?.color || (product ? DEFAULT_WORKSPACE_COLOR : suggestedColor));
  const [logoUrl, setLogoUrl] = useState(product?.logoUrl ?? '');
  const [status, setStatus] = useState(product?.status ?? 'ACTIVE');
  const [askArchive, setAskArchive] = useState(Boolean(confirmArchive));
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const confirmRef = useRef<HTMLButtonElement>(null);

  const submit = (data: FormData) =>
    start(async () => {
      setError(null);
      const result = product ? await updateProductAction(product.id, data) : await createProductAction(data);
      if (!result.ok) { setError(result.error); return; }
      onOpenChange(false);
      onDone({ text: product ? 'Cambios guardados' : `${name.trim()} ya es un espacio de trabajo` });
    });
  const archive = () =>
    start(async () => {
      if (!product) return;
      setError(null);
      const result = await archiveProductAction(product.id);
      if (!result.ok) { setError(result.error); return; }
      onOpenChange(false);
      onDone({ text: `${product.name} archivado. Sus datos se conservan.`, undoId: product.id });
    });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="gap-0 overflow-y-auto p-0"
        // Desde «Archivar…» el foco va directo a la confirmación.
        onOpenAutoFocus={(event) => { if (!confirmArchive) return; event.preventDefault(); confirmRef.current?.focus(); confirmRef.current?.scrollIntoView({ block: 'center' }); }}
      >
        <SheetHeader className="border-b px-6 pb-4 pt-6">
          <SheetTitle>{product ? `Editar ${product.name}` : 'Nuevo espacio'}</SheetTitle>
          <SheetDescription>{product ? 'Identidad y estado del espacio.' : 'Un producto propio con sus leads, demos y proyectos.'}</SheetDescription>
        </SheetHeader>
        <form action={submit} className="flex flex-1 flex-col">
          <div className="grid gap-5 px-6 py-5">
            <div aria-live="polite" className="flex items-center gap-3 rounded-lg border bg-sidebar p-3">
              <WorkspaceMark name={name || 'Nuevo espacio'} color={color} logoUrl={logoUrl || null} size="lg" />
              <div><p className="text-sm font-semibold">{name.trim() || 'Nuevo espacio'}</p><p className="text-xs text-muted-foreground">Así se verá en el selector</p></div>
            </div>

            <label className="grid gap-1.5 text-sm font-semibold">Nombre
              <input name="name" required maxLength={200} value={name} placeholder="p. ej. En La Mesa" className={input}
                onChange={(event) => { setName(event.target.value); if (!slugTouched) setSlug(slugify(event.target.value)); }} />
            </label>

            <div className="grid gap-1.5">
              <label htmlFor={`${ids}-slug`} className="text-sm font-semibold">Identificador</label>
              <div className="flex h-9 items-center rounded-md border border-input bg-card focus-within:ring-2 focus-within:ring-ring">
                <span aria-hidden className="pl-3 pr-0.5 text-sm text-muted-foreground">/</span>
                <input id={`${ids}-slug`} name="slug" required maxLength={100} pattern="[a-z0-9]+(-[a-z0-9]+)*" value={slug} aria-describedby={`${ids}-slug-hint`}
                  onChange={(event) => { setSlugTouched(true); setSlug(event.target.value); }} placeholder="en-la-mesa" className="h-full min-w-0 flex-1 bg-transparent pr-3 text-sm outline-none" />
              </div>
              <p id={`${ids}-slug-hint`} className="text-xs text-muted-foreground">Minúsculas, números y guiones. Se usa en enlaces y en los datos; se genera desde el nombre.</p>
            </div>

            <label className="grid gap-1.5 text-sm font-semibold">Descripción
              <textarea name="description" maxLength={10000} rows={2} defaultValue={product?.description ?? ''} placeholder="Qué resuelve, en una línea" className={cn(input, 'h-auto py-2')} />
            </label>

            <fieldset className="grid gap-2">
              <legend className="mb-2 text-sm font-semibold">Color</legend>
              <input type="hidden" name="color" value={color} />
              <div role="radiogroup" aria-label="Color del espacio" className="flex flex-wrap gap-2">
                {WORKSPACE_COLORS.map((option) => (
                  <button key={option.value} type="button" role="radio" aria-checked={color === option.value} aria-label={option.label} onClick={() => setColor(option.value)}
                    style={{ '--hue': option.value } as React.CSSProperties}
                    className="size-[30px] rounded-lg bg-[color-mix(in_oklab,var(--hue)_60%,var(--card))] shadow-[inset_0_0_0_1px_rgb(255_255_241/0.1)] transition-shadow aria-checked:shadow-[0_0_0_2px_var(--background),0_0_0_4px_var(--hue)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background" />
                ))}
              </div>
              <p className="text-xs text-muted-foreground">Colores ajustados al tema oscuro. El naranja queda reservado para FoxCode.</p>
            </fieldset>

            <label className="grid gap-1.5 text-sm font-semibold">Logo <span className="sr-only">(opcional)</span>
              <input name="logoUrl" type="url" maxLength={2000} value={logoUrl} onChange={(event) => setLogoUrl(event.target.value)} placeholder="https://…/logo.png" className={input} />
              <span className="text-xs font-normal text-muted-foreground">Opcional. Enlace a un PNG o SVG cuadrado; sin logo se usa la inicial.</span>
            </label>

            <fieldset className="grid gap-2">
              <legend className="mb-2 text-sm font-semibold">Estado</legend>
              <input type="hidden" name="status" value={status} />
              <div role="radiogroup" aria-label="Estado" className="inline-flex w-fit rounded-lg border bg-muted p-[3px]">
                {(['ACTIVE', 'PILOT'] as const).map((value) => (
                  <button key={value} type="button" role="radio" aria-checked={status === value} onClick={() => setStatus(value)}
                    className="rounded-md px-3 py-1 text-[13px] font-semibold text-muted-foreground transition-colors aria-checked:bg-card aria-checked:text-foreground aria-checked:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    {value === 'ACTIVE' ? 'Activo' : 'Piloto'}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">«Piloto» marca un producto en validación. No cambia ningún permiso.</p>
            </fieldset>

            {product && <DemoApiSection productId={product.id} productName={product.name} />}

            {product && (
              <div className="grid gap-2 border-t pt-5">
                <h3 className="text-sm font-semibold">Archivar espacio</h3>
                <p className="text-sm text-muted-foreground">Sale de la lista y del selector. Sus leads, demos y proyectos se conservan y vuelven si lo restauras.</p>
                {!askArchive ? (
                  <Button type="button" variant="destructive" className="w-fit" onClick={() => setAskArchive(true)}><Archive aria-hidden />Archivar…</Button>
                ) : (
                  <div role="alertdialog" aria-labelledby={`${ids}-archive`} className="grid gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                    <p id={`${ids}-archive`} className="text-sm">¿Archivar {product.name}? Saldrá del selector; puedes restaurarlo cuando quieras.</p>
                    <div className="flex gap-2">
                      <Button ref={confirmRef} type="button" variant="destructive" disabled={pending} onClick={archive}>{pending ? 'Archivando…' : 'Sí, archivar'}</Button>
                      <Button type="button" variant="outline" onClick={() => setAskArchive(false)}>Cancelar</Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {error && <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
          </div>
          <div className="sticky bottom-0 mt-auto flex justify-end gap-2 border-t bg-background px-6 py-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={pending}>{pending ? 'Guardando…' : product ? 'Guardar cambios' : 'Crear espacio'}</Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
