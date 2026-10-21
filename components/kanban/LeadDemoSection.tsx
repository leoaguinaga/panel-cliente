'use client';

import { useEffect, useId, useState, type ReactNode } from 'react';
import { Check, ChevronDown, Copy, ExternalLink, Globe, LayoutDashboard, Plus, RotateCw, Send, Trash2, UserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { slugify } from '@/src/modules/products/workspace';
import { DEMO_DURATIONS, demosApi, type LeadDemoOptions, type ProvisionedDemo, type SlugAvailability } from '@/src/modules/demos/client';
import type { LeadItem } from './LeadKanban';

const dateFormat = new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'short', timeZone: 'America/Lima' });
const shortDate = (iso: string) => dateFormat.format(new Date(iso)).replaceAll('.', '');
const daysUntil = (iso: string) => Math.ceil((Date.parse(iso) - Date.now()) / 86_400_000);
const hostOf = (url: string) => url.replace(/^https?:\/\//, '').replace(/\/$/, '');
const errorText = (err: unknown, fallback: string) => (err instanceof Error ? err.message : fallback);

/**
 * Sección «Demo» de la hoja del lead. Si el producto del lead tiene su API de
 * demos conectada, crea y administra la demo en el producto; si no, muestra
 * `fallback` (la maqueta enlazada a mano).
 */
export function LeadDemoSection({
  lead,
  disabled,
  heading,
  fallback,
  onLocalChange,
}: {
  lead: LeadItem;
  /** Lead ganado o perdido: se ve la demo pero no se crea una nueva. */
  disabled: boolean;
  heading: (title: string) => ReactNode;
  fallback: ReactNode;
  onLocalChange: (id: string, changes: Partial<LeadItem>) => void;
}) {
  const [options, setOptions] = useState<LeadDemoOptions | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const [creating, setCreating] = useState(false);
  const productId = lead.product?.id ?? null;

  useEffect(() => {
    if (!productId) return;
    let alive = true;
    demosApi
      .leadOptions(lead.id)
      .then(async (result) => {
        if (!alive) return;
        setLoadError(null);
        setOptions(result);
        // Una demo vencida desde la última vez: se trae el estado real del producto.
        const demo = result.demo;
        if (demo?.provisionStatus === 'READY' && demo.expiresAt && Date.parse(demo.expiresAt) < Date.now()) {
          const fresh = await demosApi.refresh(demo.id).catch(() => null);
          if (alive && fresh) setOptions({ ...result, demo: fresh });
        }
      })
      .catch((err) => alive && setLoadError(errorText(err, 'No se pudo cargar la demo')));
    return () => {
      alive = false;
    };
  }, [lead.id, productId, reload]);

  // Sin producto, o producto sin API conectada: la maqueta de siempre.
  if (!productId || (options && !options.enabled && options.product?.id === productId)) {
    return (
      <section aria-label="Maqueta">
        {heading('Maqueta')}
        {fallback}
      </section>
    );
  }

  const ready = options && options.product?.id === productId;
  const retry = () => {
    setLoadError(null);
    setReload((n) => n + 1);
  };
  const demo = ready ? options.demo : null;
  const setDemo = (next: ProvisionedDemo | null) => setOptions((value) => (value ? { ...value, demo: next } : value));

  let body: ReactNode;
  if (loadError) {
    body = <Problem text={loadError} onRetry={retry} />;
  } else if (!ready) {
    body = <div className="h-[92px] animate-pulse rounded-xl border bg-card motion-reduce:animate-none" aria-label="Cargando demo" />;
  } else if (creating) {
    body = (
      <CreateDemoForm
        lead={lead}
        options={options}
        initialTemplate={demo?.template ?? null}
        onCancel={() => setCreating(false)}
        onCreated={(created) => {
          setDemo(created);
          setCreating(false);
          onLocalChange(lead.id, {
            previewUrl: created.publicUrl,
            // Igual que el servidor: crear la demo saca al lead de «Mapeo en zona».
            ...(lead.status === 'MAPPED' ? { status: 'SITE_DEVELOPMENT' } : {}),
          });
        }}
      />
    );
  } else if (demo && (demo.provisionStatus === 'READY' || demo.provisionStatus === 'EXPIRED' || demo.provisionStatus === 'CLAIMED')) {
    body = (
      <DemoCard
        demo={demo}
        lead={lead}
        productName={options.product!.name}
        isAdmin={options.canDelete}
        onChange={setDemo}
        onDeleted={() => {
          setDemo(null);
          if (lead.previewUrl === demo.publicUrl) onLocalChange(lead.id, { previewUrl: null });
        }}
      />
    );
  } else if (demo && (demo.provisionStatus === 'FAILED' || demo.provisionStatus === 'PENDING')) {
    body = (
      <div className="rounded-xl border border-rose-500/40 bg-rose-500/[0.07] p-3.5 text-sm">
        <p className="font-semibold text-rose-400">{demo.provisionStatus === 'FAILED' ? 'No se pudo crear la demo' : 'La creación quedó a medias'}</p>
        {demo.provisionError && <p className="mt-0.5 text-muted-foreground">{demo.provisionError}</p>}
        {!disabled && (
          <Button type="button" variant="outline" size="xs" className="mt-3 gap-1" onClick={() => setCreating(true)}>
            <RotateCw aria-hidden="true" />
            Reintentar
          </Button>
        )}
      </div>
    );
  } else if (options.templatesError) {
    body = <Problem text={`${options.product!.name} no responde: ${options.templatesError}`} onRetry={retry} />;
  } else {
    body = (
      <div className="rounded-xl border border-dashed p-3.5 text-sm text-muted-foreground">
        <p>
          Crea en {options.product!.name} un negocio de ejemplo con el nombre de{' '}
          <span className="font-semibold text-foreground">{options.defaults.businessName}</span> para mostrarlo en la visita.
        </p>
        {!disabled && (
          <Button type="button" size="xs" className="mt-3 gap-1" onClick={() => setCreating(true)}>
            <Plus aria-hidden="true" />
            Crear demo
          </Button>
        )}
      </div>
    );
  }

  return (
    <section aria-label="Demo">
      {heading('Demo')}
      {body}
    </section>
  );
}

function Problem({ text, onRetry }: { text: string; onRetry: () => void }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-xl border border-rose-500/40 bg-rose-500/[0.07] p-3 text-sm">
      <p role="alert" className="text-rose-400">
        {text}
      </p>
      <Button type="button" variant="outline" size="xs" className="shrink-0 gap-1" onClick={onRetry}>
        <RotateCw aria-hidden="true" />
        Reintentar
      </Button>
    </div>
  );
}

/* ---------- Crear ---------- */

const inputClass =
  'h-8 w-full rounded-md border border-input bg-background px-2.5 text-[13px] outline-none focus-visible:ring-2 focus-visible:ring-ring';

function CreateDemoForm({
  lead,
  options,
  initialTemplate,
  onCancel,
  onCreated,
}: {
  lead: LeadItem;
  options: LeadDemoOptions;
  initialTemplate: string | null;
  onCancel: () => void;
  onCreated: (demo: ProvisionedDemo) => void;
}) {
  const ids = useId();
  const [name, setName] = useState(options.defaults.businessName);
  const [slug, setSlug] = useState(slugify(options.defaults.businessName));
  const [slugTouched, setSlugTouched] = useState(false);
  const [template, setTemplate] = useState(
    options.templates.find((t) => t.key === initialTemplate)?.key ?? options.templates[0]?.key ?? '',
  );
  const [days, setDays] = useState<number>(options.defaults.days);
  // Respuesta de la última dirección consultada; si no es la escrita, se está comprobando.
  const [lookup, setLookup] = useState<{ slug: string; result: SlugAvailability | null } | null>(null);
  const checking = !!slug && lookup?.slug !== slug;
  const availability = slug && lookup?.slug === slug ? lookup.result : null;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Disponibilidad en vivo, con pausa para no consultar en cada tecla.
  useEffect(() => {
    if (!slug) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      demosApi
        .slug(lead.id, slug, controller.signal)
        .then((result) => setLookup({ slug, result }))
        .catch(() => !controller.signal.aborted && setLookup({ slug, result: null }));
    }, 350);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [lead.id, slug]);

  const slugHint = checking
    ? { text: 'Comprobando…', tone: 'text-muted-foreground' }
    : !availability
      ? { text: 'Será su dirección definitiva si firma.', tone: 'text-muted-foreground' }
      : availability.available
        ? { text: availability.slug === slug ? 'Disponible' : `Disponible como «${availability.slug}»`, tone: 'text-emerald-400' }
        : {
            text: availability.reason === 'taken' ? 'Ya la usa otro negocio' : availability.reason === 'reserved' ? 'Dirección reservada' : 'Dirección no válida',
            tone: 'text-rose-400',
          };

  const canSubmit = !saving && !checking && !!name.trim() && !!template && !!availability?.available;
  const selected = options.templates.find((t) => t.key === template);

  const submit = async () => {
    setSaving(true);
    setError(null);
    try {
      onCreated(await demosApi.create(lead.id, { businessName: name.trim(), slug: availability!.slug, template, days }));
    } catch (err) {
      setError(errorText(err, 'No se pudo crear la demo'));
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3 rounded-xl border bg-card p-3.5 text-sm">
      <label className="grid gap-1 text-xs font-semibold text-muted-foreground">
        Nombre en la demo
        <input
          className={inputClass}
          value={name}
          maxLength={120}
          onChange={(event) => {
            setName(event.target.value);
            if (!slugTouched) setSlug(slugify(event.target.value));
          }}
        />
      </label>

      <div className="grid gap-1">
        <label htmlFor={`${ids}-slug`} className="text-xs font-semibold text-muted-foreground">
          Dirección de la demo
        </label>
        <input
          id={`${ids}-slug`}
          className={inputClass}
          value={slug}
          maxLength={80}
          aria-describedby={`${ids}-slug-hint`}
          onChange={(event) => {
            setSlugTouched(true);
            setSlug(slugify(event.target.value));
          }}
        />
        <p id={`${ids}-slug-hint`} aria-live="polite" className={cn('text-[11.5px]', slugHint.tone)}>
          {slugHint.text}
        </p>
      </div>

      <fieldset className="grid gap-1.5">
        <legend className="mb-1 text-xs font-semibold text-muted-foreground">Plantilla</legend>
        <div role="radiogroup" aria-label="Plantilla" className="flex flex-wrap gap-1.5">
          {options.templates.map((option) => (
            <Choice key={option.key} checked={template === option.key} onClick={() => setTemplate(option.key)}>
              {option.name}
            </Choice>
          ))}
        </div>
        {selected && <p className="text-[11.5px] text-muted-foreground">{selected.description}</p>}
      </fieldset>

      <fieldset className="grid gap-1.5">
        <legend className="mb-1 text-xs font-semibold text-muted-foreground">Caduca en</legend>
        <div role="radiogroup" aria-label="Caduca en" className="flex gap-1.5">
          {DEMO_DURATIONS.map((value) => (
            <Choice key={value} checked={days === value} onClick={() => setDays(value)}>
              {value} días
            </Choice>
          ))}
        </div>
      </fieldset>

      {error && (
        <p role="alert" className="text-xs text-rose-400">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-1.5">
        <Button type="button" variant="ghost" size="xs" onClick={onCancel} disabled={saving}>
          Cancelar
        </Button>
        <Button type="button" size="xs" onClick={submit} disabled={!canSubmit}>
          {saving ? 'Creando la demo…' : 'Crear demo'}
        </Button>
      </div>
    </div>
  );
}

function Choice({ checked, onClick, children }: { checked: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      onClick={onClick}
      className="h-7 rounded-md border border-input px-2.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring aria-checked:border-brand aria-checked:bg-brand/10 aria-checked:text-foreground"
    >
      {children}
    </button>
  );
}

/* ---------- Demo creada ---------- */

function DemoCard({
  demo,
  lead,
  productName,
  isAdmin,
  onChange,
  onDeleted,
}: {
  demo: ProvisionedDemo;
  lead: LeadItem;
  productName: string;
  /** Entregar, reenviar el acceso y eliminar son de ADMIN (D6). */
  isAdmin: boolean;
  onChange: (demo: ProvisionedDemo) => void;
  onDeleted: () => void;
}) {
  const ids = useId();
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState<'extend' | 'delete' | 'claim' | null>(null);
  const [mode, setMode] = useState<'actions' | 'delete' | 'claim'>('actions');
  const [claimName, setClaimName] = useState(lead.name);
  const [claimEmail, setClaimEmail] = useState(lead.email ?? '');
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const expired = demo.provisionStatus === 'EXPIRED';
  const claimed = demo.provisionStatus === 'CLAIMED';
  const left = demo.expiresAt ? daysUntil(demo.expiresAt) : null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(demo.publicUrl!);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  const run = async (kind: NonNullable<typeof busy>, action: () => Promise<void>) => {
    setBusy(kind);
    setError(null);
    setNotice(null);
    try {
      await action();
    } catch (err) {
      setError(errorText(err, 'No se pudo completar'));
    } finally {
      setBusy(null);
    }
  };

  const claim = (name: string, email: string) =>
    run('claim', async () => {
      const result = await demosApi.claim(demo.id, { name: name.trim(), email: email.trim() });
      const { accessEmail, ...next } = result;
      onChange(next);
      setMode('actions');
      setNotice(
        accessEmail === 'failed'
          ? { ok: false, text: 'Quedó entregada, pero el correo no salió. Usa «Reenviar acceso».' }
          : { ok: true, text: `Le enviamos a ${next.contactEmail ?? email} un correo para elegir su contraseña.` },
      );
    });

  const canClaim = claimName.trim().length >= 2 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(claimEmail.trim());

  let meta: string | null = null;
  if (claimed) meta = `Entregada · cuenta de ${demo.contactEmail ?? 'su administrador'}`;
  else if (demo.expiresAt)
    meta = expired
      ? `Caducó el ${shortDate(demo.expiresAt)}: la carta dice «Esta demo terminó»`
      : `${productName} · caduca el ${shortDate(demo.expiresAt)}${left !== null ? ` (${left === 1 ? 'mañana' : `en ${left} días`})` : ''}`;

  return (
    <div className={cn('rounded-xl border bg-card p-3 text-sm', expired && 'border-amber-500/40', claimed && 'border-emerald-500/40')}>
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground" aria-hidden="true">
          <Globe className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-[13px] font-semibold">{demo.companyName}</p>
            <span
              className={cn(
                'shrink-0 rounded-full px-2 py-px text-[10.5px] font-bold',
                expired ? 'bg-amber-500/15 text-amber-400' : 'bg-emerald-500/15 text-emerald-400',
              )}
            >
              {claimed ? 'Entregada' : expired ? 'Caducada' : 'Lista'}
            </span>
          </div>
          {demo.publicUrl && (
            <a
              href={demo.publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block truncate text-[11.5px] text-sky-400 underline-offset-2 hover:underline"
            >
              {hostOf(demo.publicUrl)}
            </a>
          )}
          {meta && <p className="mt-0.5 text-[11.5px] text-muted-foreground">{meta}</p>}
        </div>
      </div>

      {mode === 'delete' && (
        <div role="alertdialog" aria-label="Eliminar demo" className="mt-3 rounded-lg border border-rose-500/40 bg-rose-500/[0.07] p-2.5">
          <p className="text-[13px]">¿Eliminar la demo? Se borra el negocio en {productName}. No se puede deshacer.</p>
          <div className="mt-2 flex gap-1.5">
            <Button
              type="button"
              variant="destructive"
              size="xs"
              disabled={busy !== null}
              onClick={() =>
                run('delete', async () => {
                  await demosApi.remove(demo.id);
                  onDeleted();
                })
              }
            >
              {busy === 'delete' ? 'Eliminando…' : 'Eliminar'}
            </Button>
            <Button type="button" variant="ghost" size="xs" onClick={() => setMode('actions')} disabled={busy !== null}>
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {mode === 'claim' && (
        <div role="group" aria-labelledby={`${ids}-claim`} className="mt-3 space-y-2.5 rounded-lg border border-emerald-500/40 bg-emerald-500/[0.06] p-2.5">
          <p id={`${ids}-claim`} className="text-[13px]">
            <span className="font-semibold">Entregar al cliente.</span> Se crea su cuenta de administrador en {productName} con la misma carta y dirección, deja de caducar y empieza su prueba gratuita desde hoy. Le llega un correo para elegir su contraseña.
          </p>
          <label className="grid gap-1 text-xs font-semibold text-muted-foreground">
            Nombre del administrador
            <input className={inputClass} value={claimName} maxLength={120} onChange={(event) => setClaimName(event.target.value)} autoComplete="off" />
          </label>
          <label className="grid gap-1 text-xs font-semibold text-muted-foreground">
            Correo
            <input
              type="email"
              className={inputClass}
              value={claimEmail}
              maxLength={200}
              onChange={(event) => setClaimEmail(event.target.value)}
              placeholder="dueño@restaurante.pe"
              autoComplete="off"
            />
          </label>
          <div className="flex gap-1.5">
            <Button type="button" size="xs" disabled={!canClaim || busy !== null} onClick={() => claim(claimName, claimEmail)}>
              {busy === 'claim' ? 'Entregando…' : 'Entregar'}
            </Button>
            <Button type="button" variant="ghost" size="xs" onClick={() => setMode('actions')} disabled={busy !== null}>
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {mode === 'actions' && (
        <div className="mt-3 flex flex-wrap gap-1 border-t pt-3">
          {!claimed && (
            <Button type="button" variant="outline" size="xs" className="gap-1" onClick={copy} disabled={!demo.publicUrl}>
              {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
              {copied ? 'Copiado' : 'Copiar'}
            </Button>
          )}
          {demo.publicUrl && (
            <Button asChild variant="outline" size="xs" className="gap-1">
              <a href={demo.publicUrl} target="_blank" rel="noopener noreferrer">
                Abrir
                <ExternalLink aria-hidden="true" />
              </a>
            </Button>
          )}
          {demo.panelUrl && (
            <Button asChild variant="outline" size="xs" className="gap-1">
              <a href={demo.panelUrl} target="_blank" rel="noopener noreferrer" title={`Abre el panel de ${productName} con tu sesión de operador`}>
                <LayoutDashboard aria-hidden="true" />
                Panel
              </a>
            </Button>
          )}
          {claimed ? (
            isAdmin && (
              <Button
                type="button"
                variant="outline"
                size="xs"
                className="gap-1"
                disabled={busy !== null}
                onClick={() => claim(demo.contactName ?? lead.name, demo.contactEmail ?? '')}
              >
                <Send aria-hidden="true" />
                {busy === 'claim' ? 'Reenviando…' : 'Reenviar acceso'}
              </Button>
            )
          ) : (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant={expired ? 'default' : 'outline'} size="xs" className="gap-1" disabled={busy !== null}>
                    {busy === 'extend' ? 'Extendiendo…' : expired ? 'Reactivar' : 'Extender'}
                    <ChevronDown aria-hidden="true" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {DEMO_DURATIONS.map((days) => (
                    <DropdownMenuItem key={days} onSelect={() => run('extend', async () => onChange(await demosApi.extend(demo.id, days)))}>
                      {expired ? `${days} días desde hoy` : `+${days} días`}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              {isAdmin && (
                <>
                  <Button type="button" size="xs" className="gap-1" onClick={() => setMode('claim')} disabled={busy !== null}>
                    <UserCheck aria-hidden="true" />
                    Entregar al cliente
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    className="ml-auto text-muted-foreground hover:text-rose-400"
                    aria-label="Eliminar demo"
                    onClick={() => setMode('delete')}
                    disabled={busy !== null}
                  >
                    <Trash2 aria-hidden="true" />
                  </Button>
                </>
              )}
            </>
          )}
        </div>
      )}

      {notice && (
        <p role={notice.ok ? 'status' : 'alert'} className={cn('mt-2 text-xs', notice.ok ? 'text-emerald-400' : 'text-amber-400')}>
          {notice.text}
        </p>
      )}
      {error && (
        <p role="alert" className="mt-2 text-xs text-rose-400">
          {error}
        </p>
      )}
    </div>
  );
}
