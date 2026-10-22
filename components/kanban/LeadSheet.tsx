'use client';

import { useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { CalendarDays, Check, ChevronDown, Copy, ExternalLink, Globe, Mail, MapPin, Phone, Sparkles } from 'lucide-react';
import { changeLeadStatusAction, patchLeadAction, type LeadPatch } from '@/src/modules/leads/server/actions';
import type { LeadItem } from './LeadKanban';
import { KanbanAvatar, type KanbanColumnDef } from './KanbanBoard';
import { LeadProposals } from '@/components/proposals/LeadProposals';
import { LeadDemoSection } from './LeadDemoSection';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { formatProjectPriority } from '@/lib/formatters';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

/** Los estados de entrada (landing, referidos) solo aparecen cuando tienen prospectos. */
export const LEAD_COLUMNS: Array<KanbanColumnDef & { inbound?: boolean }> = [
  { id: 'MAPPED', title: 'Mapeo en zona', dot: 'bg-muted-foreground' },
  { id: 'SITE_DEVELOPMENT', title: 'Desarrollo autónomo', dot: 'bg-cyan-400' },
  { id: 'NEW', title: 'Nuevo', dot: 'bg-sky-400', inbound: true },
  { id: 'CONTACTED', title: 'Contactado', dot: 'bg-indigo-400', inbound: true },
  { id: 'MEETING_SCHEDULED', title: 'Reunión agendada', dot: 'bg-violet-400', inbound: true },
  { id: 'PRESENTED', title: 'Contactado / Demo', dot: 'bg-purple-400' },
  { id: 'QUOTED', title: 'Cotizado', dot: 'bg-orange-400', inbound: true },
  { id: 'FEEDBACK_CHANGES', title: 'En negociación', dot: 'bg-amber-400' },
  { id: 'WON', title: 'Aceptado / Ganado', dot: 'bg-emerald-400' },
  { id: 'LOST', title: 'Rechazado', dot: 'bg-rose-400' },
];

export const stageTitle = (status: string) => LEAD_COLUMNS.find((col) => col.id === status)?.title ?? status;

/** Camino de prospección propia y camino de entrada (landing, referidos). */
const OUTBOUND_PATH = ['MAPPED', 'SITE_DEVELOPMENT', 'PRESENTED', 'FEEDBACK_CHANGES', 'WON'];
const INBOUND_PATH = ['NEW', 'CONTACTED', 'MEETING_SCHEDULED', 'PRESENTED', 'QUOTED', 'FEEDBACK_CHANGES', 'WON'];

export function stagePathFor(lead: LeadItem) {
  if (OUTBOUND_PATH.includes(lead.status) && !INBOUND_PATH.includes(lead.status)) return OUTBOUND_PATH;
  if (INBOUND_PATH.includes(lead.status) && !OUTBOUND_PATH.includes(lead.status)) return INBOUND_PATH;
  return lead.source ? INBOUND_PATH : OUTBOUND_PATH;
}

export const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;

export const LEAD_TYPE_OPTIONS = [
  { value: 'LANDING', label: 'Sitio web / landing' },
  { value: 'SYSTEM', label: 'Software a medida' },
  { value: 'APP', label: 'Aplicación móvil' },
  { value: 'FOXROOMS', label: 'FoxRooms' },
  { value: 'GENERAL', label: 'General' },
];

const LOST_REASONS = ['Precio', 'Sin respuesta', 'Eligió a otro', 'No era el momento', 'Otro'];

/* ---------- Fechas en día calendario de Lima ---------- */

const limaKeyFormat = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit' });
const dayLabelFormat = new Intl.DateTimeFormat('es-PE', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });

/** YYYY-MM-DD del día en Lima. */
export const limaDayKey = (value: Date | string) => limaKeyFormat.format(new Date(value));
export const addDays = (key: string, days: number) => {
  const date = new Date(`${key}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};
const daysBetween = (from: string, to: string) => Math.round((Date.parse(`${to}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`)) / 86_400_000);
// Mediodía de Lima: el día no se corre al convertir a UTC (igual que en la ficha).
const keyToIso = (key: string) => `${key}T12:00:00-05:00`;
export const shortDay = (key: string) => dayLabelFormat.format(new Date(`${key}T12:00:00Z`)).replaceAll('.', '');

/** Días hasta el siguiente paso (negativo = vencido); null si no hay fecha. */
export function nextActionDays(lead: Pick<LeadItem, 'nextActionAt'>, today = limaDayKey(new Date())) {
  return lead.nextActionAt ? daysBetween(today, limaDayKey(lead.nextActionAt)) : null;
}

function relativeDay(key: string, today: string) {
  const diff = daysBetween(today, key);
  const prefix = diff === 0 ? 'Hoy' : diff === 1 ? 'Mañana' : diff === -1 ? 'Ayer' : null;
  return prefix ? `${prefix}, ${shortDay(key)}` : shortDay(key).replace(/^./, (c) => c.toUpperCase());
}

/* ---------- Contacto ---------- */

export const hrefFor = (url: string) => (url.startsWith('http') ? url : `https://${url}`);

export function whatsappNumber(phone: string | null) {
  let digits = (phone ?? '').replace(/\D/g, '');
  // Celular peruano sin código de país.
  if (digits.length === 9 && digits.startsWith('9')) digits = `51${digits}`;
  return digits.length >= 8 ? digits : null;
}

export function whatsappText(lead: LeadItem) {
  const business = lead.companyName || lead.name;
  const greeting = lead.name && lead.name !== lead.companyName ? `Hola ${lead.name.split(' ')[0]}` : 'Hola';
  return lead.previewUrl
    ? `${greeting}, te escribo de FoxCode. Preparamos una maqueta de la web de ${business}: ${hrefFor(lead.previewUrl)} ¿Te parece si la revisamos en una llamada corta?`
    : `${greeting}, te escribo de FoxCode. Queríamos conversar sobre la web de ${business}.`;
}

/** Guardado optimista compartido por el panel lateral y la ficha completa. */
export function useLeadEditor(
  lead: LeadItem,
  onLocalChange: (id: string, changes: Partial<LeadItem>) => void,
  onWon?: (lead: LeadItem) => void,
) {
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [error, setError] = useState<string | null>(null);

  /** Cambio optimista: se muestra al instante y se revierte si el servidor falla. */
  const persist = async (changes: Partial<LeadItem>, call: () => Promise<unknown>) => {
    const previous = Object.fromEntries(Object.keys(changes).map((key) => [key, lead[key as keyof LeadItem]])) as Partial<LeadItem>;
    onLocalChange(lead.id, changes);
    setSaveState('saving');
    setError(null);
    try {
      await call();
      setSaveState('saved');
      return true;
    } catch (err) {
      onLocalChange(lead.id, previous);
      setSaveState('error');
      setError(err instanceof Error ? err.message : 'No se pudo guardar el cambio');
      return false;
    }
  };

  const patch = (changes: Partial<LeadItem>, body: LeadPatch) => persist(changes, () => patchLeadAction(lead.id, body));

  const moveTo = (status: string) => {
    if (status === lead.status) return;
    void persist({ status, lostReason: null }, () => changeLeadStatusAction(lead.id, status));
    if (status === 'WON') onWon?.({ ...lead, status });
  };

  const markLost = (reason: string) => persist({ status: 'LOST', lostReason: reason || null }, () => changeLeadStatusAction(lead.id, 'LOST', reason || null));

  const setNextDate = (key: string | null) => {
    void patch({ nextActionAt: key ? keyToIso(key) : null }, { nextActionAt: key ? keyToIso(key) : null });
  };

  const logContact = () => {
    const now = new Date().toISOString();
    void patch({ lastContactAt: now }, { lastContactAt: now });
  };

  const completeStep = () => {
    const now = new Date().toISOString();
    void patch({ nextActionAt: null, nextActionNote: null, lastContactAt: now }, { nextActionAt: null, nextActionNote: null, lastContactAt: now });
  };

  return { saveState, error, persist, patch, moveTo, markLost, setNextDate, logContact, completeStep };
}

/* ---------- Panel ---------- */

type Worker = { id: string; name: string };
export type SaveState = 'idle' | 'saving' | 'saved' | 'error';

export function LeadSheet({
  lead,
  open,
  onOpenChange,
  workers,
  products,
  onLocalChange,
  onConvert,
}: {
  lead: LeadItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workers: Worker[];
  products: { id: string; name: string }[];
  /** Actualiza el lead en el tablero (optimista). */
  onLocalChange: (id: string, changes: Partial<LeadItem>) => void;
  /** Abre el diálogo de conversión a cliente y proyecto. */
  onConvert: (lead: LeadItem) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="gap-0 p-0 sm:max-w-[440px]">
        {lead && (
          <LeadSheetBody key={lead.id} lead={lead} workers={workers} products={products} onLocalChange={onLocalChange} onConvert={onConvert} />
        )}
      </SheetContent>
    </Sheet>
  );
}

function LeadSheetBody({
  lead,
  workers,
  products,
  onLocalChange,
  onConvert,
}: {
  lead: LeadItem;
  workers: Worker[];
  products: { id: string; name: string }[];
  onLocalChange: (id: string, changes: Partial<LeadItem>) => void;
  onConvert: (lead: LeadItem) => void;
}) {
  const today = limaDayKey(new Date());
  const [losing, setLosing] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);
  const [dataOpen, setDataOpen] = useState(false);
  const previewInputRef = useRef<HTMLInputElement>(null);
  const { saveState, error, patch, moveTo, markLost: markLostAs, setNextDate: saveNextDate, logContact, completeStep } = useLeadEditor(lead, onLocalChange, onConvert);

  const markLost = async (reason: string) => {
    if (await markLostAs(reason)) setLosing(false);
  };

  const setNextDate = (key: string | null) => {
    setRescheduling(false);
    saveNextDate(key);
  };

  const addPreview = () => {
    setDataOpen(true);
    requestAnimationFrame(() => previewInputRef.current?.focus());
  };

  const path = stagePathFor(lead);
  const stageIndex = path.indexOf(lead.status);
  const nextStage = stageIndex >= 0 && stageIndex < path.length - 1 ? path[stageIndex + 1] : null;
  const isWon = lead.status === 'WON';
  const isLost = lead.status === 'LOST';
  const dueIn = nextActionDays(lead, today);
  const overdue = dueIn !== null && dueIn < 0 && !rescheduling;
  const product = lead.product;
  const typeLabel = LEAD_TYPE_OPTIONS.find((option) => option.value === lead.type)?.label;

  let stepBlock: ReactNode;
  if (losing) {
    stepBlock = <LostForm onCancel={() => setLosing(false)} onConfirm={markLost} />;
  } else if (isLost) {
    stepBlock = (
      <div className="rounded-xl border bg-card p-3.5 text-sm">
        <p className="font-semibold">Lead perdido</p>
        <p className="mt-0.5 text-muted-foreground">{lead.lostReason ? `Motivo: ${lead.lostReason}` : 'Sin motivo registrado'}</p>
        <Button type="button" variant="outline" size="xs" className="mt-3" onClick={() => moveTo(path[0])}>
          Reabrir en {stageTitle(path[0])}
        </Button>
      </div>
    );
  } else if (isWon) {
    stepBlock = (
      <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3.5 text-sm">
        <p className="font-semibold">¡Lead ganado!</p>
        <p className="mt-0.5 text-muted-foreground">Falta convertirlo en cliente y proyecto.</p>
        <Button type="button" size="xs" className="mt-3 gap-1 bg-emerald-500 text-emerald-950 hover:bg-emerald-400" onClick={() => onConvert(lead)}>
          <Sparkles aria-hidden="true" />
          Crear cliente y proyecto
        </Button>
      </div>
    );
  } else if (overdue) {
    stepBlock = (
      <div className="rounded-xl border border-rose-500/45 bg-rose-500/[0.07] p-3.5 text-sm">
        <p>
          <span className="font-semibold text-rose-400">Vencido hace {-dueIn} {dueIn === -1 ? 'día' : 'días'}</span>
          <span className="text-muted-foreground"> · {shortDay(limaDayKey(lead.nextActionAt!))}</span>
        </p>
        {lead.nextActionNote && <p className="mt-0.5 text-muted-foreground">{lead.nextActionNote}</p>}
        <div className="mt-3 flex gap-1.5">
          <Button type="button" variant="outline" size="xs" className="gap-1" onClick={completeStep}>
            <Check aria-hidden="true" />
            Hecho
          </Button>
          <Button type="button" variant="outline" size="xs" onClick={() => setRescheduling(true)}>
            Reprogramar
          </Button>
        </div>
      </div>
    );
  } else {
    stepBlock = <NextStepEditor lead={lead} today={today} onDate={setNextDate} onNote={(note) => patch({ nextActionNote: note }, { nextActionNote: note })} onLogContact={logContact} />;
  }

  const waNumber = whatsappNumber(lead.phone);

  return (
    <>
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 pb-4 pt-5 [scrollbar-width:thin]">
        {/* Encabezado */}
        <div>
          <div className="pr-8">
            <SheetTitle className="text-xl font-bold leading-tight">{lead.companyName || lead.name}</SheetTitle>
            <SheetDescription className="mt-0.5 text-[13px]">
              Contacto: {lead.name}
              {typeLabel && lead.type !== 'GENERAL' ? ` · ${typeLabel}` : ''}
            </SheetDescription>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {lead.zone && (
              <span className={chip}>
                <MapPin className="size-3" aria-hidden="true" />
                {lead.zone}
              </span>
            )}
            {products.length > 0 && (
              <ChipMenu
                label={product?.name ?? 'FoxCode (servicios)'}
                ariaLabel="Cambiar espacio"
                value={product?.id ?? 'none'}
                options={[{ value: 'none', label: 'FoxCode (servicios)' }, ...products.map((p) => ({ value: p.id, label: p.name }))]}
                onChange={(value) => {
                  const next = products.find((p) => p.id === value);
                  void patch({ product: next ? { id: next.id, name: next.name, color: null } : null }, { productId: next?.id ?? null });
                }}
              />
            )}
            <ChipMenu
              label={`Prioridad ${formatProjectPriority(lead.priority).toLowerCase()}`}
              ariaLabel="Cambiar prioridad"
              tone={lead.priority === 'URGENT' ? 'rose' : lead.priority === 'HIGH' ? 'amber' : undefined}
              value={lead.priority}
              options={PRIORITIES.map((value) => ({ value, label: formatProjectPriority(value) }))}
              onChange={(value) => void patch({ priority: value as LeadItem['priority'] }, { priority: value })}
            />
            <ChipMenu
              label={lead.assignedTo?.name ?? 'Sin responsable'}
              ariaLabel="Cambiar responsable"
              icon={lead.assignedTo ? <KanbanAvatar name={lead.assignedTo.name} /> : undefined}
              value={lead.assignedTo?.id ?? 'none'}
              options={[{ value: 'none', label: 'Sin responsable' }, ...workers.map((w) => ({ value: w.id, label: w.name }))]}
              onChange={(value) => {
                const worker = workers.find((w) => w.id === value);
                void patch({ assignedTo: worker ? { id: worker.id, name: worker.name } : null }, { assignedToId: worker?.id ?? null });
              }}
            />
          </div>
        </div>

        {/* Etapa */}
        <section aria-labelledby="lead-stage">
          <SectionLabel id="lead-stage" hint={stageIndex >= 0 ? `${stageIndex + 1} de ${path.length}` : undefined}>
            Etapa
          </SectionLabel>
          <div className={cn('flex gap-1', isLost && 'opacity-50')}>
            {path.map((status, index) => {
              const current = index === stageIndex;
              return (
                <button
                  key={status}
                  type="button"
                  title={stageTitle(status)}
                  aria-label={`Mover a ${stageTitle(status)}`}
                  aria-current={current ? 'step' : undefined}
                  onClick={() => moveTo(status)}
                  className="group flex-1 rounded-full py-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span
                    className={cn(
                      'block h-1.5 rounded-full transition-colors group-hover:ring-2 group-hover:ring-foreground/20',
                      current ? (status === 'WON' ? 'bg-emerald-400' : 'bg-foreground') : index < stageIndex ? 'bg-muted-foreground/60' : 'bg-muted',
                    )}
                  />
                </button>
              );
            })}
          </div>
          <div className="mt-1.5 flex items-center justify-between gap-2">
            <p className="text-sm font-bold">{isLost ? 'Rechazado' : stageTitle(lead.status)}</p>
            {nextStage && !isLost && (
              <Button type="button" variant="outline" size="xs" onClick={() => moveTo(nextStage)}>
                Avanzar a {stageTitle(nextStage)} →
              </Button>
            )}
          </div>
        </section>

        {/* Siguiente paso */}
        <section aria-labelledby="lead-next">
          <SectionLabel id="lead-next">{losing ? 'Marcar como perdido' : isWon ? 'Cierre' : isLost ? 'Resultado' : 'Siguiente paso'}</SectionLabel>
          {stepBlock}
        </section>

        {/* Propuestas */}
        <section aria-labelledby="lead-proposals">
          <SectionLabel id="lead-proposals">Propuestas</SectionLabel>
          <LeadProposals leadId={lead.id} disabled={isLost || isWon} />
        </section>

        {/* Contactar */}
        <section aria-labelledby="lead-contact">
          <SectionLabel id="lead-contact">Contactar</SectionLabel>
          <div className="grid grid-cols-3 gap-1.5">
            <ContactButton
              href={waNumber ? `https://wa.me/${waNumber}?text=${encodeURIComponent(whatsappText(lead))}` : null}
              external
              icon={<WhatsAppIcon />}
              label="WhatsApp"
              detail={lead.phone}
              missing="Sin teléfono"
            />
            <ContactButton href={waNumber ? `tel:+${waNumber}` : null} icon={<Phone className="size-4" aria-hidden="true" />} label="Llamar" detail={lead.phone} missing="Sin teléfono" />
            <ContactButton href={lead.email ? `mailto:${lead.email}` : null} icon={<Mail className="size-4" aria-hidden="true" />} label="Correo" detail={lead.email} missing="Sin correo" />
          </div>
        </section>

        {/* Demo: creada en el producto si tiene API conectada; si no, la maqueta enlazada a mano */}
        <LeadDemoSection
          lead={lead}
          disabled={isLost || isWon}
          heading={(title) => <SectionLabel id="lead-demo">{title}</SectionLabel>}
          onLocalChange={onLocalChange}
          fallback={
            lead.previewUrl ? (
              <PreviewCard name={lead.companyName || lead.name} url={lead.previewUrl} />
            ) : (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-dashed p-3 text-sm text-muted-foreground">
                Sin maqueta todavía
                <Button type="button" variant="outline" size="xs" onClick={addPreview}>
                  Añadir enlace
                </Button>
              </div>
            )
          }
        />

        {/* Notas */}
        <section aria-labelledby="lead-notes">
          <SectionLabel id="lead-notes" hint="se guardan al salir del campo">
            Notas
          </SectionLabel>
          <NotesField value={lead.message} onSave={(message) => patch({ message }, { message })} labelledBy="lead-notes" />
        </section>

        {/* Datos */}
        <LeadDataForm lead={lead} open={dataOpen} onOpenChange={setDataOpen} previewInputRef={previewInputRef} onSave={patch} />
      </div>

      <div className="flex items-center justify-between gap-2 border-t px-5 py-3">
        <Link href={`/internal/leads/${lead.id}`} className="text-xs font-semibold text-muted-foreground underline underline-offset-4 hover:text-foreground">
          Ver ficha completa →
        </Link>
        <SaveStatus state={saveState} error={error} />
        {!isLost && !losing ? (
          <Button type="button" variant="ghost" size="xs" className="text-muted-foreground" onClick={() => setLosing(true)}>
            Marcar como perdido
          </Button>
        ) : (
          <span />
        )}
      </div>
    </>
  );
}

/* ---------- Piezas ---------- */

export const chip = 'inline-flex items-center gap-1.5 rounded-full border bg-card px-2.5 py-0.5 text-xs font-semibold text-muted-foreground';

export function SectionLabel({ id, hint, children }: { id: string; hint?: string; children: ReactNode }) {
  return (
    <h3 id={id} className="mb-2 flex items-baseline justify-between text-[11px] font-bold uppercase tracking-[0.07em] text-muted-foreground">
      {children}
      {hint && <span className="text-[11px] font-medium normal-case tracking-normal">{hint}</span>}
    </h3>
  );
}

export function ChipMenu({
  label,
  ariaLabel,
  icon,
  tone,
  value,
  options,
  onChange,
}: {
  label: string;
  ariaLabel: string;
  icon?: ReactNode;
  tone?: 'amber' | 'rose';
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`${ariaLabel}: ${label}`}
        className={cn(
          chip,
          'cursor-pointer transition-colors hover:border-foreground/30 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:text-foreground',
          icon && 'pl-1',
          tone === 'amber' && 'border-amber-500/35 bg-amber-500/10 text-amber-400 hover:text-amber-300',
          tone === 'rose' && 'border-rose-500/40 bg-rose-500/10 text-rose-400 hover:text-rose-300',
        )}
      >
        {icon && <span className="[&>span]:size-[18px] [&>span]:text-[8px]">{icon}</span>}
        {label}
        <ChevronDown className="size-3" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-44">
        <DropdownMenuRadioGroup value={value} onValueChange={(next) => next !== value && onChange(next)}>
          {options.map((option) => (
            <DropdownMenuRadioItem key={option.value} value={option.value}>
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function NextStepEditor({
  lead,
  today,
  onDate,
  onNote,
  onLogContact,
}: {
  lead: LeadItem;
  today: string;
  onDate: (key: string | null) => void;
  onNote: (note: string | null) => void;
  onLogContact: () => void;
}) {
  const dateRef = useRef<HTMLInputElement>(null);
  const [note, setNote] = useState(lead.nextActionNote ?? '');
  const dateKey = lead.nextActionAt ? limaDayKey(lead.nextActionAt) : null;
  const sinceContact = lead.lastContactAt ? daysBetween(limaDayKey(lead.lastContactAt), today) : null;
  const stale = sinceContact === null || sinceContact >= 7;

  const saveNote = () => {
    const next = note.trim();
    if (next !== (lead.nextActionNote ?? '')) onNote(next || null);
  };

  const openPicker = () => {
    const input = dateRef.current;
    if (!input) return;
    try {
      input.showPicker();
    } catch {
      input.focus();
    }
  };

  const quick = [
    { label: 'Hoy', key: today },
    { label: 'Mañana', key: addDays(today, 1) },
    { label: '+1 semana', key: addDays(today, 7) },
  ];

  return (
    <div className="rounded-xl border bg-card p-3.5">
      <div className="relative inline-flex">
        <button
          type="button"
          onClick={openPicker}
          className="inline-flex items-center gap-2 rounded-lg border bg-background px-2.5 py-1.5 text-sm font-bold hover:border-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <CalendarDays className="size-4" aria-hidden="true" />
          {dateKey ? relativeDay(dateKey, today) : 'Sin fecha'}
          <span className="sr-only">. Elegir fecha del siguiente paso</span>
        </button>
        <input
          ref={dateRef}
          type="date"
          tabIndex={-1}
          aria-hidden="true"
          value={dateKey ?? ''}
          onChange={(event) => event.target.value && onDate(event.target.value)}
          className="pointer-events-none absolute inset-0 opacity-0"
        />
      </div>
      <input
        value={note}
        onChange={(event) => setNote(event.target.value)}
        onBlur={saveNote}
        onKeyDown={(event) => event.key === 'Enter' && event.currentTarget.blur()}
        placeholder="Qué hay que hacer (p. ej. enviar la maqueta)"
        aria-label="Qué hay que hacer en el siguiente paso"
        maxLength={200}
        className="mt-2.5 block w-full rounded-lg border bg-background px-2.5 py-1.5 text-[13px] outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
      />
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {quick.map((option) => (
          <Button key={option.label} type="button" variant="outline" size="xs" aria-pressed={dateKey === option.key} onClick={() => onDate(option.key)} className="aria-pressed:border-foreground/40 aria-pressed:text-foreground">
            {option.label}
          </Button>
        ))}
        {dateKey && (
          <Button type="button" variant="ghost" size="xs" className="text-muted-foreground" onClick={() => onDate(null)}>
            Quitar
          </Button>
        )}
      </div>
      <div className="mt-3 flex items-center justify-between gap-2 border-t pt-3 text-[12.5px] text-muted-foreground">
        <span>
          Último contacto:{' '}
          <b className={cn('font-semibold', stale ? 'text-amber-400' : 'text-foreground')}>
            {sinceContact === null ? 'sin registrar' : sinceContact <= 0 ? 'hoy' : sinceContact === 1 ? 'ayer' : `hace ${sinceContact} días`}
          </b>
        </span>
        <Button type="button" variant="outline" size="xs" className="gap-1" onClick={onLogContact} disabled={sinceContact === 0}>
          <Check aria-hidden="true" />
          Registré un contacto
        </Button>
      </div>
    </div>
  );
}

export function LostForm({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: (reason: string) => void }) {
  const [reason, setReason] = useState<string | null>(null);
  const [detail, setDetail] = useState('');
  const full = [reason, detail.trim()].filter(Boolean).join(': ');
  return (
    <div className="rounded-xl border bg-card p-3.5 text-sm">
      <p id="lost-reason" className="font-semibold">
        ¿Por qué se perdió?
      </p>
      <div role="radiogroup" aria-labelledby="lost-reason" className="my-2.5 flex flex-wrap gap-1.5">
        {LOST_REASONS.map((option) => (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={reason === option}
            onClick={() => setReason(reason === option ? null : option)}
            className={cn(
              'rounded-full border px-2.5 py-0.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              reason === option && 'border-foreground/40 bg-muted text-foreground',
            )}
          >
            {option}
          </button>
        ))}
      </div>
      <input
        value={detail}
        onChange={(event) => setDetail(event.target.value)}
        placeholder="Detalle (opcional)"
        aria-label="Detalle del motivo"
        maxLength={200}
        className="block w-full rounded-lg border bg-background px-2.5 py-1.5 text-[13px] outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
      />
      <div className="mt-3 flex justify-end gap-1.5">
        <Button type="button" variant="ghost" size="xs" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="button" variant="destructive" size="xs" onClick={() => onConfirm(full)}>
          Marcar perdido
        </Button>
      </div>
    </div>
  );
}

export function ContactButton({ href, external, icon, label, detail, missing }: { href: string | null; external?: boolean; icon: ReactNode; label: string; detail: string | null; missing: string }) {
  const body = (
    <>
      {icon}
      {label}
      <small className="max-w-full truncate text-[10.5px] font-medium text-muted-foreground">{href ? detail : missing}</small>
    </>
  );
  const base = 'flex min-w-0 flex-col items-center gap-1 rounded-xl border bg-card px-1.5 py-2.5 text-xs font-semibold';
  if (!href) {
    return (
      <span aria-disabled="true" className={cn(base, 'opacity-45')}>
        {body}
      </span>
    );
  }
  return (
    <a
      href={href}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      className={cn(base, 'transition-colors hover:border-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring')}
    >
      {body}
    </a>
  );
}

export function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="size-4 text-[#25d366]">
      <path d="M12 2a10 10 0 0 0-8.7 15l-1.3 5 5.1-1.3A10 10 0 1 0 12 2Zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.5-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2.1 1-2.4c.3-.3.6-.3.8-.3h.6c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.4.6-.4.4c-.1.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.4 1.5.3.1.5.1.6-.1l.9-1c.2-.3.4-.2.7-.1l1.9.9c.3.1.5.2.5.3.1.2.1.7-.1 1.3Z" />
    </svg>
  );
}

export function PreviewCard({ name, url }: { name: string; url: string }) {
  const [copied, setCopied] = useState(false);
  const href = hrefFor(url);
  const host = href.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card p-2.5">
      <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground" aria-hidden="true">
        <Globe className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold">Demo · {name}</p>
        <p className="truncate text-[11.5px] text-muted-foreground">{host}</p>
      </div>
      <div className="flex shrink-0 gap-1">
        <Button type="button" variant="outline" size="xs" onClick={copy} className="gap-1">
          {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
          {copied ? 'Copiado' : 'Copiar'}
        </Button>
        <Button asChild variant="outline" size="xs" className="gap-1">
          <a href={href} target="_blank" rel="noopener noreferrer">
            Abrir
            <ExternalLink aria-hidden="true" />
          </a>
        </Button>
      </div>
    </div>
  );
}

export function NotesField({ value, onSave, labelledBy }: { value: string | null; onSave: (value: string | null) => void; labelledBy: string }) {
  const [draft, setDraft] = useState(value ?? '');
  return (
    <textarea
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={() => {
        const next = draft.trim();
        if (next !== (value ?? '')) onSave(next || null);
      }}
      rows={3}
      aria-labelledby={labelledBy}
      placeholder="Competencia en la zona, qué le interesa, cómo prefiere que lo contacten…"
      className="block w-full resize-y rounded-lg border bg-card px-3 py-2 text-[13px] leading-relaxed outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
    />
  );
}

const dataField = 'mt-1 block h-8 w-full rounded-lg border bg-background px-2.5 text-[13px] font-normal text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring';

export function LeadDataForm({
  lead,
  open,
  onOpenChange,
  previewInputRef,
  onSave,
}: {
  lead: LeadItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  previewInputRef: React.RefObject<HTMLInputElement | null>;
  onSave: (changes: Partial<LeadItem>, body: LeadPatch) => Promise<boolean>;
}) {
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const text = (key: string) => String(form.get(key) || '').trim();
    const companyName = text('companyName') || null;
    const name = text('name') || companyName || '';
    if (!name) {
      setFormError('Escribe el nombre del negocio o del contacto.');
      return;
    }
    setFormError(null);
    const changes = {
      name,
      companyName,
      phone: text('phone') || null,
      email: text('email') || null,
      zone: text('zone') || null,
      type: text('type') || lead.type,
      previewUrl: text('previewUrl') || null,
    };
    setPending(true);
    await onSave(changes, changes);
    setPending(false);
  };

  return (
    <details open={open} onToggle={(event) => onOpenChange(event.currentTarget.open)} className="group rounded-xl border bg-card">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 rounded-xl px-3.5 py-2.5 text-[13px] font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
        Datos del prospecto
        <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
          teléfono, correo, tipo, URL
          <ChevronDown className="size-3.5 transition-transform group-open:rotate-180" aria-hidden="true" />
        </span>
      </summary>
      <form onSubmit={submit} className="grid grid-cols-2 gap-2.5 px-3.5 pb-3.5">
        <label className="text-xs font-semibold text-muted-foreground">
          Negocio
          <input name="companyName" defaultValue={lead.companyName ?? ''} className={dataField} />
        </label>
        <label className="text-xs font-semibold text-muted-foreground">
          Contacto
          <input name="name" defaultValue={lead.name} className={dataField} />
        </label>
        <label className="text-xs font-semibold text-muted-foreground">
          Teléfono / WhatsApp
          <input name="phone" type="tel" defaultValue={lead.phone ?? ''} placeholder="+51 999 888 777" className={dataField} />
        </label>
        <label className="text-xs font-semibold text-muted-foreground">
          Correo
          <input name="email" type="email" defaultValue={lead.email ?? ''} placeholder="contacto@…" className={dataField} />
        </label>
        <label className="text-xs font-semibold text-muted-foreground">
          Zona
          <input name="zone" defaultValue={lead.zone ?? ''} placeholder="Chiclayo - Cafeterías" className={dataField} />
        </label>
        <label className="text-xs font-semibold text-muted-foreground">
          Tipo de servicio
          <select name="type" defaultValue={lead.type} className={dataField}>
            {LEAD_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="col-span-2 text-xs font-semibold text-muted-foreground">
          URL de la maqueta
          <input ref={previewInputRef} name="previewUrl" defaultValue={lead.previewUrl ?? ''} placeholder="https://negocio-demo.vercel.app" className={dataField} />
        </label>
        {formError && (
          <p role="alert" className="col-span-2 text-xs text-rose-400">
            {formError}
          </p>
        )}
        <div className="col-span-2 flex justify-end">
          <Button type="submit" size="xs" disabled={pending}>
            {pending ? 'Guardando…' : 'Guardar datos'}
          </Button>
        </div>
      </form>
    </details>
  );
}

export function SaveStatus({ state, error }: { state: SaveState; error: string | null }) {
  return (
    <span role="status" aria-live="polite" className="flex min-w-0 items-center gap-1.5 text-[11.5px] text-muted-foreground">
      {state === 'saving' && 'Guardando…'}
      {state === 'saved' && (
        <>
          <span className="size-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
          Guardado
        </>
      )}
      {state === 'error' && <span className="truncate text-rose-400" title={error ?? undefined}>{error ?? 'No se pudo guardar'}</span>}
    </span>
  );
}
