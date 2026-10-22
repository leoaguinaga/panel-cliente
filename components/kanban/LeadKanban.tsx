'use client';

import { useState, useTransition } from 'react';
import {
  changeLeadStatusAction,
  convertLeadToProjectAction,
} from '@/src/modules/leads/server/actions';
import { Building2, Calendar, ExternalLink, MapPin, Sparkles } from 'lucide-react';
import { KanbanAvatar, KanbanCard, KanbanColumn, KanbanScroller, useKanbanDrag } from './KanbanBoard';
import { LEAD_COLUMNS, LeadSheet, limaDayKey, nextActionDays } from './LeadSheet';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { formatProjectPriority, defaultProjectTypeForLead, formatCompactDate, formatProjectType, isWebsiteProjectType, projectTypeOptions } from '@/lib/formatters';

export type LeadItem = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  companyName: string | null;
  type: string;
  status: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  zone: string | null;
  previewUrl: string | null;
  message: string | null;
  assignedTo?: { id: string; name: string; email?: string } | null;
  product?: { id: string; name: string; color: string | null } | null;
  source?: string | null;
  createdAt?: string;
  lastContactAt?: string | null;
  nextActionAt?: string | null;
  nextActionNote?: string | null;
  lostReason?: string | null;
};

type Worker = { id: string; name: string };

export function LeadKanban({
  initialLeads,
  workers,
  products = [],
  initialLeadId,
}: {
  initialLeads: LeadItem[];
  workers: Worker[];
  products?: { id: string; name: string }[];
  /** `?lead=` abre su panel al llegar (p. ej. al volver del editor de propuestas). */
  initialLeadId?: string;
}) {
  const [leads, setLeads] = useState<LeadItem[]>(initialLeads);
  const [syncedLeads, setSyncedLeads] = useState(initialLeads);
  // Las acciones revalidan la página sin desmontar el tablero. Adoptar la
  // nueva lista del servidor conserva el panel abierto y los cambios locales
  // mientras no haya una nueva respuesta del servidor.
  if (syncedLeads !== initialLeads) {
    setSyncedLeads(initialLeads);
    setLeads(initialLeads);
  }
  const [isPending, startTransition] = useTransition();


  // Convert Modal State
  const [convertModalOpen, setConvertModalOpen] = useState(false);
  const [selectedLeadForConvert, setSelectedLeadForConvert] = useState<LeadItem | null>(null);
  const [convertProjectName, setConvertProjectName] = useState('');
  const [convertProjectType, setConvertProjectType] = useState('WEBSITE');
  const [convertPrice, setConvertPrice] = useState('1500');
  const [convertCurrency, setConvertCurrency] = useState<'USD' | 'PEN'>('USD');
  const [convertWorkerId, setConvertWorkerId] = useState('');
  const [convertSuccess, setConvertSuccess] = useState<string | null>(null);
  const [convertError, setConvertError] = useState<string | null>(null);

  // Panel del lead: se lee del estado del tablero para reflejar cada cambio al instante.
  const [sheetOpen, setSheetOpen] = useState(() => Boolean(initialLeadId && initialLeads.some((lead) => lead.id === initialLeadId)));
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(initialLeadId ?? null);
  const selectedLead = leads.find((lead) => lead.id === selectedLeadId) ?? null;
  const today = limaDayKey(new Date());

  const openLead = (lead: LeadItem) => {
    setSelectedLeadId(lead.id);
    setSheetOpen(true);
  };

  const updateLocalLead = (id: string, changes: Partial<LeadItem>) => {
    setLeads((prev) => prev.map((item) => (item.id === id ? { ...item, ...changes } : item)));
  };

  const openConvert = (lead: LeadItem) => {
    setSelectedLeadForConvert(lead);
    setConvertProjectType(defaultProjectTypeForLead(lead.type));
    setConvertProjectName('');
    setConvertWorkerId(lead.assignedTo?.id || '');
    setConvertCurrency('USD');
    setConvertModalOpen(true);
  };

  const moveLead = (lead: LeadItem, targetStatus: string) => {
    if (lead.status === targetStatus) return;
    // Actualización inmediata; si el servidor falla se vuelve al estado anterior.
    const previous = leads;
    setLeads((prev) => prev.map((item) => (item.id === lead.id ? { ...item, status: targetStatus } : item)));
    // Ganado abre la conversión a cliente y proyecto.
    if (targetStatus === 'WON') openConvert(lead);
    startTransition(async () => {
      try {
        await changeLeadStatusAction(lead.id, targetStatus);
      } catch {
        setLeads(previous);
      }
    });
  };

  const { dragged, dropTarget, dragProps, dropProps } = useKanbanDrag(leads, moveLead);

  const handleConvertSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeadForConvert) return;
    setConvertError(null);

    startTransition(async () => {
      try {
        const res = await convertLeadToProjectAction(
          selectedLeadForConvert.id,
          convertProjectName,
          Number(convertPrice) || 0,
          convertWorkerId || null,
          convertProjectType,
          convertCurrency
        );
        if (res?.project?.id) {
          setConvertSuccess(
            `¡Proyecto creado con éxito! Redirigiendo a /internal/projects/${res.project.id}`
          );
          setTimeout(() => {
            window.location.href = `/internal/projects/${res.project.id}`;
          }, 1000);
        } else {
          setConvertModalOpen(false);
        }
      } catch (err: unknown) {
        setConvertError(err instanceof Error ? err.message : 'Error al convertir prospecto');
      }
    });
  };

  const visibleColumns = LEAD_COLUMNS.filter((col) => !col.inbound || leads.some((lead) => lead.status === col.id));

  return (
    <div className="space-y-3">
      <KanbanScroller label="Embudo de prospectos" columns={visibleColumns.length}>
        {visibleColumns.map((col) => {
          const colLeads = leads.filter((lead) => lead.status === col.id);
          return (
            <KanbanColumn key={col.id} column={col} count={colLeads.length} highlighted={dropTarget === col.id} dropProps={dropProps(col.id, col.id)} emptyLabel="Sin prospectos en este estado">
              {colLeads.map((lead) => (
                <KanbanCard key={lead.id} dragProps={dragProps(lead)} dragging={dragged === lead.id} dimmed={col.id === 'LOST'} onOpen={() => openLead(lead)}>
                  <div className="flex min-w-0 items-center gap-1.5 text-[11px] text-muted-foreground">
                    {lead.zone && (
                      <span className="inline-flex min-w-0 items-center gap-1 truncate rounded border px-1.5 font-semibold">
                        <MapPin className="size-2.5 shrink-0" aria-hidden="true" />
                        <span className="truncate">{lead.zone}</span>
                      </span>
                    )}
                    <NextActionMark lead={lead} today={today} />
                    {(lead.priority === 'URGENT' || lead.priority === 'HIGH') && (
                      <span className={cn('shrink-0 rounded px-1.5 text-[10px] font-bold uppercase tracking-wide', lead.priority === 'URGENT' ? 'bg-rose-500/15 text-rose-400' : 'bg-amber-500/15 text-amber-400')}>{formatProjectPriority(lead.priority)}</span>
                    )}
                  </div>
                  <div>
                    <h3 className="line-clamp-2 font-semibold leading-snug">
                      <button type="button" data-card-open className="text-left after:absolute after:inset-0 after:rounded-lg focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-ring" aria-label={`Abrir ${lead.companyName || lead.name}`}>
                        {lead.companyName || lead.name}
                      </button>
                    </h3>
                    {lead.companyName && lead.name !== lead.companyName && <p className="mt-0.5 truncate text-[11px] text-muted-foreground">Contacto: {lead.name}</p>}
                  </div>
                  {lead.previewUrl && (
                    <a
                      href={lead.previewUrl.startsWith('http') ? lead.previewUrl : `https://${lead.previewUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      draggable={false}
                      className="relative z-10 inline-flex max-w-full items-center gap-1 text-[11px] font-medium text-sky-400 hover:underline"
                    >
                      <span className="truncate">Ver maqueta web</span>
                      <ExternalLink className="size-3 shrink-0" aria-hidden="true" />
                    </a>
                  )}
                  <div className="flex items-center gap-2.5 text-[11px] text-muted-foreground">
                    {lead.createdAt && (
                      <span className="inline-flex items-center gap-1 whitespace-nowrap">
                        <Calendar className="size-3" aria-hidden="true" />
                        {formatCompactDate(lead.createdAt)}
                      </span>
                    )}
                    {col.id === 'WON' ? (
                      <Button type="button" size="xs" onClick={() => openConvert(lead)} className="relative z-10 ml-auto gap-1">
                        <Building2 aria-hidden="true" />
                        Crear proyecto
                      </Button>
                    ) : (
                      <span className="ml-auto" title={lead.assignedTo?.name ?? 'Sin responsable'}>
                        {lead.assignedTo ? <KanbanAvatar name={lead.assignedTo.name} /> : <span className="text-[10px]">Sin responsable</span>}
                      </span>
                    )}
                  </div>
                </KanbanCard>
              ))}
            </KanbanColumn>
          );
        })}
      </KanbanScroller>

      <LeadSheet
        lead={selectedLead}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        workers={workers}
        products={products}
        onLocalChange={updateLocalLead}
        onConvert={(lead) => {
          // El diálogo de conversión no vive en un portal: el panel se cierra para no taparlo.
          setSheetOpen(false);
          openConvert(lead);
        }}
      />

      {/* Convert to Project Dialog */}
      {convertModalOpen && selectedLeadForConvert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div role="dialog" aria-modal="true" aria-label="Convertir en cliente y proyecto" className="w-full max-w-lg space-y-4 rounded-xl border bg-card p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between border-b pb-3">
              <div>
                <h3 className="flex items-center gap-2 text-lg font-semibold">
                  <Sparkles className="size-5 text-primary" />
                  Convertir en cliente y proyecto
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Se creará el cliente y un proyecto del tipo elegido, con su primer sprint activo.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setConvertModalOpen(false)}
                aria-label="Cerrar" className="text-lg leading-none text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConvertSubmit} className="space-y-3.5">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Tipo de proyecto
                </label>
                <select
                  value={convertProjectType}
                  onChange={(e) => setConvertProjectType(e.target.value)}
                  className="mb-3.5 w-full rounded-lg border bg-background px-2.5 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {projectTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <label className="mb-1 block text-sm font-medium">
                  Nombre del proyecto
                </label>
                <input
                  placeholder={`${formatProjectType(convertProjectType)} - ${selectedLeadForConvert.companyName || selectedLeadForConvert.name}`}
                  value={convertProjectName}
                  onChange={(e) => setConvertProjectName(e.target.value)}
                  className="w-full rounded-lg border bg-background px-2.5 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="convert-price" className="mb-1 block text-sm font-medium">
                    Precio Total Acordado
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      id="convert-price"
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      value={convertPrice}
                      onChange={(e) => setConvertPrice(e.target.value)}
                      className="min-w-0 flex-1 rounded-lg border bg-background px-2.5 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                    <select
                      aria-label="Moneda del precio"
                      value={convertCurrency}
                      onChange={(e) => setConvertCurrency(e.target.value as 'USD' | 'PEN')}
                      className="rounded-lg border bg-background px-2 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="USD">USD</option>
                      <option value="PEN">PEN</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Responsable Asignado
                  </label>
                  <select
                    value={convertWorkerId}
                    onChange={(e) => setConvertWorkerId(e.target.value)}
                    className="w-full rounded-lg border bg-background px-2.5 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">Seleccionar responsable...</option>
                    {workers.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1 rounded-lg border bg-muted/40 p-3.5 text-xs text-muted-foreground">
                <p className="font-semibold text-foreground">Se generará automáticamente:</p>
                <p>✓ Cliente activo con datos de contacto y demo asociado.</p>
                <p>✓ Sprint 1: Kickoff (activo).</p>
                {isWebsiteProjectType(convertProjectType) && <p>✓ Requerimiento REQ-01: personalización y despliegue del sitio, con su primera tarea.</p>}
              </div>

              {convertError && (
                <p role="alert" className="rounded-lg border border-rose-500/40 bg-rose-500/10 p-2.5 text-xs text-rose-200">
                  {convertError}
                </p>
              )}

              {convertSuccess && (
                <p className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-2.5 text-xs text-emerald-200">
                  {convertSuccess}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-lg"
                  onClick={() => setConvertModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  disabled={isPending}
                  type="submit"
                  size="sm"
                  className="rounded-lg"
                >
                  {isPending ? 'Creando proyecto…' : 'Crear cliente y proyecto'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/** Marca del siguiente paso en la tarjeta: vencido en rojo, hoy en ámbar. */
function NextActionMark({ lead, today }: { lead: LeadItem; today: string }) {
  if (lead.status === 'WON' || lead.status === 'LOST') return null;
  const days = nextActionDays(lead, today);
  if (days === null || days > 0) return null;
  return (
    <span className={cn('shrink-0 rounded px-1.5 text-[10px] font-bold uppercase tracking-wide', days < 0 ? 'bg-rose-500/15 text-rose-400' : 'bg-amber-500/15 text-amber-400')}>
      {days < 0 ? 'Vencido' : 'Hoy'}
    </span>
  );
}
