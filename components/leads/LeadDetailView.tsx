'use client';

import { useRef, useState, useTransition, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowUpRight, Check, Mail, MapPin, MoreHorizontal, Phone, Sparkles, Video } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { KanbanAvatar } from '@/components/kanban/KanbanBoard';
import { LeadProposals } from '@/components/proposals/LeadProposals';
import { LeadDemoSection } from '@/components/kanban/LeadDemoSection';
import type { LeadItem } from '@/components/kanban/LeadKanban';
import {
  ContactButton,
  ChipMenu,
  LEAD_TYPE_OPTIONS,
  LeadDataForm,
  LostForm,
  NextStepEditor,
  NotesField,
  PRIORITIES,
  PreviewCard,
  SaveStatus,
  SectionLabel,
  WhatsAppIcon,
  chip,
  limaDayKey,
  nextActionDays,
  shortDay,
  stagePathFor,
  stageTitle,
  useLeadEditor,
  whatsappNumber,
  whatsappText,
} from '@/components/kanban/LeadSheet';
import { convertLeadToProjectAction } from '@/src/modules/leads/server/actions';
import { convertLeadToClientAction } from '@/src/modules/clients/server/actions';
import { defaultProjectTypeForLead, formatProjectPriority, formatProjectType, projectTypeOptions } from '@/lib/formatters';
import type { LeadDetail } from '@/src/lib/api/contracts';
import { LeadMeetings } from './LeadMeetings';

type Worker = { id: string; name: string };

const SOURCE_LABELS: Record<string, string> = {
  landing: 'Formulario de la landing',
  landing_reunion: 'Agenda de la landing',
};

const registeredFormat = new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'America/Lima' });

export function LeadDetailView({
  initialLead,
  workers,
  products,
  currentUserId,
  google,
}: {
  initialLead: LeadDetail;
  workers: Worker[];
  products: { id: string; name: string }[];
  currentUserId: string;
  google: { configured: boolean; connected: boolean; email: string | null } | null;
}) {
  const router = useRouter();
  const [lead, setLead] = useState<LeadDetail>(initialLead);
  // Si el servidor trae una versión nueva (router.refresh), manda sobre el estado local.
  const [serverLead, setServerLead] = useState(initialLead);
  if (serverLead !== initialLead) {
    setServerLead(initialLead);
    setLead(initialLead);
  }

  const onLocalChange = (_id: string, changes: Partial<LeadItem>) => setLead((current) => ({ ...current, ...changes }));
  const convertRef = useRef<HTMLDivElement>(null);
  const meetingsRef = useRef<HTMLElement>(null);
  const previewInputRef = useRef<HTMLInputElement>(null);
  const [meetingSignal, setMeetingSignal] = useState(0);
  const [losing, setLosing] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);
  const [dataOpen, setDataOpen] = useState(true);

  const focusConvert = () => convertRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  const { saveState, error, patch, moveTo, markLost, setNextDate, logContact, completeStep } = useLeadEditor(lead, onLocalChange, focusConvert);

  const today = limaDayKey(new Date());
  const path = stagePathFor(lead);
  const stageIndex = path.indexOf(lead.status);
  const nextStage = stageIndex >= 0 && stageIndex < path.length - 1 ? path[stageIndex + 1] : null;
  const isWon = lead.status === 'WON';
  const isLost = lead.status === 'LOST';
  const closed = isWon || isLost;
  const dueIn = nextActionDays(lead, today);
  const overdue = dueIn !== null && dueIn < 0 && !rescheduling;
  const typeLabel = LEAD_TYPE_OPTIONS.find((option) => option.value === lead.type)?.label;
  const waNumber = whatsappNumber(lead.phone);
  const title = lead.companyName || lead.name;

  const scheduleMeeting = () => {
    // El formulario se desplaza a la vista al montarse.
    setMeetingSignal((value) => value + 1);
  };

  let stepBlock: ReactNode;
  if (losing) {
    stepBlock = (
      <LostForm
        onCancel={() => setLosing(false)}
        onConfirm={async (reason) => {
          if (await markLost(reason)) setLosing(false);
        }}
      />
    );
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
        <p className="mt-0.5 text-muted-foreground">{lead.clientId ? 'Ya es cliente.' : 'Falta convertirlo en cliente y proyecto.'}</p>
      </div>
    );
  } else if (overdue) {
    stepBlock = (
      <div className="rounded-xl border border-rose-500/45 bg-rose-500/[0.07] p-3.5 text-sm">
        <p>
          <span className="font-semibold text-rose-400">
            Vencido hace {-dueIn} {dueIn === -1 ? 'día' : 'días'}
          </span>
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
    stepBlock = (
      <NextStepEditor
        lead={lead}
        today={today}
        onDate={(key) => {
          setRescheduling(false);
          setNextDate(key);
        }}
        onNote={(note) => patch({ nextActionNote: note }, { nextActionNote: note })}
        onLogContact={logContact}
      />
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      {/* Encabezado */}
      <header className="border-b pb-5">
        <Link
          href="/internal/leads"
          className="inline-flex items-center gap-1 rounded-md text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          Leads
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
          <div className="min-w-0">
            <h1 className="text-4xl text-balance break-words sm:text-5xl">{title}</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {lead.companyName && lead.companyName !== lead.name ? <>Contacto: <span className="text-foreground">{lead.name}</span> · </> : null}
              {typeLabel && lead.type !== 'GENERAL' ? `${typeLabel} · ` : ''}
              Registrado el {lead.createdAt ? registeredFormat.format(new Date(lead.createdAt)).replaceAll('.', '') : '—'}
              {lead.source ? ` · ${SOURCE_LABELS[lead.source] ?? lead.source}` : ''}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {lead.zone && (
                <span className={chip}>
                  <MapPin className="size-3" aria-hidden="true" />
                  {lead.zone}
                </span>
              )}
              {products.length > 0 && (
                <ChipMenu
                  label={lead.product?.name ?? 'FoxCode (servicios)'}
                  ariaLabel="Cambiar espacio"
                  value={lead.product?.id ?? 'none'}
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

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <SaveStatus state={saveState} error={error} />
            {!closed && (
              <Button type="button" size="sm" className="gap-1.5" onClick={scheduleMeeting}>
                <Video aria-hidden="true" />
                Agendar reunión
              </Button>
            )}
            {!lead.clientId && !isLost && (
              <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={focusConvert}>
                <Sparkles aria-hidden="true" />
                Convertir
              </Button>
            )}
            {!isLost && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="outline" size="icon-sm" aria-label="Más acciones">
                    <MoreHorizontal aria-hidden="true" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem className="text-rose-400 focus:text-rose-300" onSelect={() => setLosing(true)}>
                    Marcar como perdido
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </header>

      {/* Etapa */}
      <section aria-labelledby="lead-stage" className="border-b py-5">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="lead-stage" className="text-[11px] font-bold uppercase tracking-[0.07em] text-muted-foreground">
            Etapa <span className="font-medium normal-case tracking-normal">{stageIndex >= 0 ? `· ${stageIndex + 1} de ${path.length}` : ''}</span>
          </h2>
          {nextStage && !isLost && (
            <Button type="button" variant="outline" size="xs" onClick={() => moveTo(nextStage)}>
              Avanzar a {stageTitle(nextStage)} →
            </Button>
          )}
        </div>
        <ol className={cn('grid gap-1.5', isLost && 'opacity-50')} style={{ gridTemplateColumns: `repeat(${path.length}, minmax(0, 1fr))` }}>
          {path.map((status, index) => {
            const current = index === stageIndex;
            const done = stageIndex >= 0 && index < stageIndex;
            return (
              <li key={status} className="min-w-0">
                <button
                  type="button"
                  aria-label={`Mover a ${stageTitle(status)}`}
                  title={stageTitle(status)}
                  aria-current={current ? 'step' : undefined}
                  onClick={() => moveTo(status)}
                  className="group block w-full rounded-md pb-1 pt-1.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span
                    className={cn(
                      'block h-1.5 rounded-full transition-colors group-hover:ring-2 group-hover:ring-foreground/20',
                      current ? (status === 'WON' ? 'bg-emerald-400' : 'bg-primary') : done ? 'bg-muted-foreground/60' : 'bg-muted',
                    )}
                  />
                  <span
                    className={cn(
                      'mt-2 hidden truncate text-xs md:block',
                      current ? 'font-bold text-foreground' : done ? 'text-muted-foreground' : 'text-muted-foreground/70 group-hover:text-muted-foreground',
                    )}
                  >
                    {stageTitle(status)}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
        <p className="mt-2 text-sm font-bold md:hidden">{isLost ? 'Rechazado' : stageTitle(lead.status)}</p>
      </section>

      <div className="grid gap-x-10 gap-y-8 pt-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        {/* Trabajo con el prospecto */}
        <div className="min-w-0 space-y-8">
          <section aria-labelledby="lead-next">
            <SectionLabel id="lead-next">{losing ? 'Marcar como perdido' : isWon ? 'Cierre' : isLost ? 'Resultado' : 'Siguiente paso'}</SectionLabel>
            {stepBlock}
          </section>

          <section ref={meetingsRef} aria-labelledby="lead-meetings" className="scroll-mt-24">
            <SectionLabel id="lead-meetings" hint={google?.connected ? `Meet con ${google.email}` : undefined}>
              Reuniones
            </SectionLabel>
            <LeadMeetings
              lead={lead}
              meetings={lead.meetings}
              workers={workers}
              currentUserId={currentUserId}
              google={google}
              disabled={closed}
              openSignal={meetingSignal}
              onScheduled={() => router.refresh()}
            />
          </section>

          <section aria-labelledby="lead-proposals">
            <SectionLabel id="lead-proposals">Propuestas</SectionLabel>
            <LeadProposals leadId={lead.id} disabled={closed} />
          </section>

          <LeadDemoSection
            lead={lead}
            disabled={closed}
            heading={(heading) => <SectionLabel id="lead-demo">{heading}</SectionLabel>}
            onLocalChange={onLocalChange}
            fallback={
              lead.previewUrl ? (
                <PreviewCard name={title} url={lead.previewUrl} />
              ) : (
                <div className="flex items-center justify-between gap-3 rounded-xl border border-dashed p-3 text-sm text-muted-foreground">
                  Sin maqueta todavía
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={() => {
                      setDataOpen(true);
                      requestAnimationFrame(() => previewInputRef.current?.focus());
                    }}
                  >
                    Añadir enlace
                  </Button>
                </div>
              )
            }
          />

          <section aria-labelledby="lead-notes">
            <SectionLabel id="lead-notes" hint="se guardan al salir del campo">
              Notas
            </SectionLabel>
            <NotesField key={`${lead.id}-${initialLead.updatedAt}`} value={lead.message} onSave={(message) => patch({ message }, { message })} labelledBy="lead-notes" />
          </section>
        </div>

        {/* Contacto y datos */}
        <aside className="min-w-0 space-y-8" aria-label="Contacto y datos del prospecto">
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

          <LeadDataForm key={initialLead.updatedAt} lead={lead} open={dataOpen} onOpenChange={setDataOpen} previewInputRef={previewInputRef} onSave={patch} />

          <div ref={convertRef} className="scroll-mt-24">
            {lead.clientId ? <ConvertedCard lead={lead} /> : !isLost && <ConvertCard lead={lead} workers={workers} highlight={isWon} />}
          </div>
        </aside>
      </div>
    </div>
  );
}

function ConvertedCard({ lead }: { lead: LeadDetail }) {
  return (
    <section aria-labelledby="lead-client" className="rounded-xl border border-emerald-500/35 bg-emerald-500/[0.07] p-4 text-sm">
      <h2 id="lead-client" className="font-semibold">
        Ya es cliente
      </h2>
      <div className="mt-2.5 flex flex-col gap-1.5">
        <Link href={`/internal/clients/${lead.clientId}`} className="inline-flex items-center gap-1 font-semibold underline-offset-4 hover:underline">
          Ver cliente <ArrowUpRight className="size-3.5" aria-hidden="true" />
        </Link>
        {(lead.project || lead.convertedProjectId) && (
          <Link href={`/internal/projects/${lead.project?.id ?? lead.convertedProjectId}`} className="inline-flex items-center gap-1 font-semibold underline-offset-4 hover:underline">
            {lead.project?.name ?? 'Ver proyecto'} <ArrowUpRight className="size-3.5" aria-hidden="true" />
          </Link>
        )}
      </div>
    </section>
  );
}

const convertField = 'mt-1 block h-8 w-full rounded-lg border bg-background px-2.5 text-[13px] font-normal text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring';

function ConvertCard({ lead, workers, highlight }: { lead: LeadDetail; workers: Worker[]; highlight: boolean }) {
  const router = useRouter();
  const [mode, setMode] = useState<'project' | 'client'>('project');
  const [projectType, setProjectType] = useState(defaultProjectTypeForLead(lead.type));
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const business = lead.companyName || lead.name;

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const text = (key: string) => String(form.get(key) || '').trim();
    setError(null);
    start(async () => {
      try {
        if (mode === 'client') {
          await convertLeadToClientAction(lead.id);
          router.refresh();
          return;
        }
        const res = await convertLeadToProjectAction(lead.id, text('projectName') || undefined, Number(text('price')) || 0, text('workerId') || null, projectType);
        if (res?.project?.id) router.push(`/internal/projects/${res.project.id}`);
        else router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo convertir el lead');
      }
    });
  };

  return (
    <section aria-labelledby="lead-convert" className={cn('rounded-xl border bg-card p-4', highlight && 'border-emerald-500/45 ring-1 ring-emerald-500/20')}>
      <h2 id="lead-convert" className="flex items-center gap-1.5 text-sm font-bold">
        <Sparkles className={cn('size-4', highlight ? 'text-emerald-400' : 'text-muted-foreground')} aria-hidden="true" />
        Convertir en cliente
      </h2>
      <div role="radiogroup" aria-label="Qué crear" className="mt-3 grid grid-cols-2 gap-1 rounded-lg bg-muted p-0.5">
        {(
          [
            ['project', 'Con proyecto'],
            ['client', 'Solo cliente'],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={mode === value}
            onClick={() => setMode(value)}
            className={cn(
              'rounded-md py-1 text-xs font-semibold text-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              mode === value ? 'bg-card text-foreground shadow-xs' : 'hover:text-foreground',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="mt-3 space-y-2.5">
        {mode === 'project' ? (
          <>
            <label className="block text-xs font-semibold text-muted-foreground">
              Tipo de proyecto
              <select value={projectType} onChange={(event) => setProjectType(event.target.value)} className={convertField}>
                {projectTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-semibold text-muted-foreground">
              Nombre del proyecto
              <input name="projectName" placeholder={`${formatProjectType(projectType)} - ${business}`} className={convertField} />
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <label className="block text-xs font-semibold text-muted-foreground">
                Precio (USD)
                <input name="price" type="number" min="0" step="0.01" required defaultValue="1500" className={cn(convertField, 'tabular-nums')} />
              </label>
              <label className="block text-xs font-semibold text-muted-foreground">
                Responsable
                <select name="workerId" defaultValue={lead.assignedTo?.id ?? ''} className={convertField}>
                  <option value="">Sin asignar</option>
                  {workers.map((worker) => (
                    <option key={worker.id} value={worker.id}>
                      {worker.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <p className="text-[12px] leading-relaxed text-muted-foreground">Crea el cliente con sus datos de contacto y el proyecto con su Sprint 1 activo.</p>
          </>
        ) : (
          <p className="text-[12.5px] leading-relaxed text-muted-foreground">Crea el cliente con sus datos de contacto, sin proyecto. Podrás crearlo después desde su ficha.</p>
        )}
        {error && (
          <p role="alert" className="text-[12.5px] text-rose-400">
            {error}
          </p>
        )}
        <Button type="submit" size="sm" variant={highlight ? 'default' : 'outline'} disabled={pending} className={cn('w-full', highlight && 'bg-emerald-500 text-emerald-950 hover:bg-emerald-400')}>
          {pending ? 'Creando…' : mode === 'project' ? 'Crear cliente y proyecto' : 'Crear cliente'}
        </Button>
      </form>
    </section>
  );
}
