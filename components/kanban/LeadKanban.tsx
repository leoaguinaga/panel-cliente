'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import {
  changeLeadStatusAction,
  convertLeadToProjectAction,
  updateLeadAction,
} from '@/src/modules/leads/server/actions';
import {
  ExternalLink,
  MapPin,
  Sparkles,
  Phone,
  Mail,
  Building2,
  Calendar,
  MoreVertical,
  GripVertical,
  Edit3,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useHorizontalDragScroll } from '@/hooks/use-horizontal-drag-scroll';
import { formatCompactDate } from '@/lib/formatters';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

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
  createdAt?: string;
  lastContactAt?: string | null;
};

type Worker = { id: string; name: string };

const COLUMNS: Array<{
  id: string;
  title: string;
  dotColor: string;
  columnBg: string;
  headerColor: string;
}> = [
    {
      id: 'MAPPED',
      title: 'Mapeo en Zona',
      dotColor: 'bg-mauve-700',
      columnBg: 'bg-[#F6F7FB] border-slate-200/70',
      headerColor: 'text-slate-700',
    },
    {
      id: 'SITE_DEVELOPMENT',
      title: 'Desarrollo Autónomo',
      dotColor: 'bg-cyan-600',
      columnBg: 'bg-[#F0F6FF] border-blue-100/70',
      headerColor: 'text-slate-700',
    },
    {
      id: 'PRESENTED',
      title: 'Contactado / Demo',
      dotColor: 'bg-purple-600',
      columnBg: 'bg-[#F7F5FF] border-purple-100/70',
      headerColor: 'text-slate-700',
    },
    {
      id: 'FEEDBACK_CHANGES',
      title: 'En Negociación',
      dotColor: 'bg-amber-500',
      columnBg: 'bg-[#FFF9F2] border-amber-100/70',
      headerColor: 'text-slate-700',
    },
    {
      id: 'WON',
      title: 'Aceptado / Ganado',
      dotColor: 'bg-emerald-500',
      columnBg: 'bg-[#F2FAF5] border-emerald-100/70',
      headerColor: 'text-slate-700',
    },
    {
      id: 'LOST',
      title: 'Rechazado',
      dotColor: 'bg-rose-500',
      columnBg: 'bg-[#FFF2F4] border-rose-100/70',
      headerColor: 'text-slate-700',
    },
  ];

const field =
  'mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2 text-xs font-medium text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-blue-600 transition-all';

export function LeadKanban({
  initialLeads,
  workers,
}: {
  initialLeads: LeadItem[];
  workers: Worker[];
}) {
  const [leads, setLeads] = useState<LeadItem[]>(initialLeads);
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const { containerRef, headerProps, onKeyDown: handleBoardKeyDown } = useHorizontalDragScroll();

  // Convert Modal State
  const [convertModalOpen, setConvertModalOpen] = useState(false);
  const [selectedLeadForConvert, setSelectedLeadForConvert] = useState<LeadItem | null>(null);
  const [convertProjectName, setConvertProjectName] = useState('');
  const [convertPrice, setConvertPrice] = useState('1500');
  const [convertWorkerId, setConvertWorkerId] = useState('');
  const [convertSuccess, setConvertSuccess] = useState<string | null>(null);
  const [convertError, setConvertError] = useState<string | null>(null);

  // Edit Sheet State
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [selectedLeadForEdit, setSelectedLeadForEdit] = useState<LeadItem | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  // Open Edit Sheet
  const handleOpenEditSheet = (lead: LeadItem) => {
    setSelectedLeadForEdit(lead);
    setEditError(null);
    setEditSheetOpen(true);
  };

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    setDraggedLeadId(id);
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    if (dragOverColumn !== columnId) {
      setDragOverColumn(columnId);
    }
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    setDragOverColumn(null);
    const leadId = e.dataTransfer.getData('text/plain') || draggedLeadId;
    if (!leadId) return;

    const lead = leads.find((l) => l.id === leadId);
    if (!lead || lead.status === targetStatus) {
      setDraggedLeadId(null);
      return;
    }

    // Optimistic UI update
    setLeads((prev) =>
      prev.map((item) =>
        item.id === leadId ? { ...item, status: targetStatus } : item
      )
    );
    setDraggedLeadId(null);

    // If dropped into WON, trigger modal prompt
    if (targetStatus === 'WON') {
      setSelectedLeadForConvert(lead);
      setConvertProjectName(
        lead.companyName
          ? `Sitio Web - ${lead.companyName}`
          : `Sitio Web - ${lead.name}`
      );
      setConvertWorkerId(lead.assignedTo?.id || '');
      setConvertModalOpen(true);
    }

    // Server update
    startTransition(async () => {
      try {
        await changeLeadStatusAction(leadId, targetStatus);
      } catch {
        setLeads(initialLeads);
      }
    });
  };

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
          convertWorkerId || null
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
      } catch (err: any) {
        setConvertError(err?.message || 'Error al convertir prospecto');
      }
    });
  };

  const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedLeadForEdit) return;
    setEditError(null);

    const formData = new FormData(e.currentTarget);
    const updatedCompany = String(formData.get('companyName') || '');
    const updatedName = String(formData.get('name') || '');
    const updatedZone = String(formData.get('zone') || '');
    const updatedPriority = String(formData.get('priority') || 'MEDIUM') as LeadItem['priority'];
    const updatedStatus = String(formData.get('status') || selectedLeadForEdit.status);
    const updatedPreview = String(formData.get('previewUrl') || '');
    const updatedPhone = String(formData.get('phone') || '');
    const updatedEmail = String(formData.get('email') || '');
    const updatedWorkerId = String(formData.get('assignedToId') || '');
    const updatedWorker = workers.find((w) => w.id === updatedWorkerId);

    // Optimistic update
    setLeads((prev) =>
      prev.map((l) =>
        l.id === selectedLeadForEdit.id
          ? {
            ...l,
            companyName: updatedCompany || null,
            name: updatedName || l.name,
            zone: updatedZone || null,
            priority: updatedPriority,
            status: updatedStatus,
            previewUrl: updatedPreview || null,
            phone: updatedPhone || null,
            email: updatedEmail || null,
            assignedTo: updatedWorker ? { id: updatedWorker.id, name: updatedWorker.name } : null,
          }
          : l
      )
    );

    startTransition(async () => {
      try {
        await updateLeadAction(selectedLeadForEdit.id, formData);
        setEditSheetOpen(false);
      } catch (err: any) {
        setEditError(err?.message || 'Error al actualizar la información del prospecto');
      }
    });
  };

  const getPriorityPill = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return (
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-100">
            Urgent
          </span>
        );
      case 'HIGH':
        return (
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100">
            High
          </span>
        );
      case 'LOW':
        return (
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-sky-50 text-sky-600 border border-sky-100">
            Low
          </span>
        );
      default:
        return (
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-100">
            Medium
          </span>
        );
    }
  };

  const getLeadProgressPercent = (status: string) => {
    switch (status) {
      case 'WON':
        return 100;
      case 'FEEDBACK_CHANGES':
        return 75;
      case 'PRESENTED':
        return 50;
      case 'SITE_DEVELOPMENT':
        return 30;
      case 'LOST':
        return 0;
      default:
        return 15;
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'UN';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-3">
      {/* Board Columns: Natural standard width with horizontal scroll and Grip scroll */}
      <div
        ref={containerRef}
        className="flex gap-4 scroll-smooth pb-6 pt-1 pl-1 select-none overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ msOverflowStyle: 'none' }}
        tabIndex={0}
        aria-label="Estados del flujo de prospectos"
        onKeyDown={handleBoardKeyDown}
      >
        {COLUMNS.map((col) => {
          const colLeads = leads.filter((l) => l.status === col.id);
          const isOver = dragOverColumn === col.id;

          return (
            <div
              key={col.id}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col.id)}
              className={`shrink-0 w-95 rounded-2xl border p-4 flex flex-col h-fit max-h-[75vh] transition-all ${"bg-gray-100/40"
                } ${isOver ? 'ring-2 ring-blue-500/80 ring-offset-2 bg-white/95' : ''}`}
            >
              {/* Column Header */}
              <div
                className="flex items-center justify-between px-1 py-1 mb-2 cursor-grab active:cursor-grabbing touch-pan-y select-none"
                {...headerProps}
                aria-label={`Arrastra para desplazarte por los estados desde ${col.title}`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${col.dotColor}`} />
                  <h3 className={`font-semibold text-xs truncate ${col.headerColor}`}>
                    {col.title}
                  </h3>
                  <span className="text-xs font-normal text-slate-400 shrink-0">
                    ({colLeads.length})
                  </span>
                </div>

                <span
                  className="text-slate-400 p-1 rounded-lg cursor-grab active:cursor-grabbing"
                  aria-hidden="true"
                >
                  <GripVertical className="size-4" />
                </span>
              </div>

              {/* Cards Container */}
              <div className="flex-1 space-y-3 overflow-y-auto pr-0.5">
                {colLeads.length === 0 ? (
                  <div className="border border-dashed border-slate-300/70 rounded-xl flex flex-col items-center justify-center text-center p-3 text-xs text-slate-400">
                    Sin prospectos en este estado
                  </div>
                ) : (
                  colLeads.map((lead) => {
                    const progress = getLeadProgressPercent(lead.status);

                    return (
                      <div
                        key={lead.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, lead.id)}
                        className={`group relative rounded-xl bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-md transition-all cursor-grab active:cursor-grabbing border border-slate-100 space-y-3 ${draggedLeadId === lead.id ? 'opacity-40 scale-95' : ''
                          }`}
                      >
                        {/* Top row: Priority Pill, 6-dots handle & 3-dots Menu Button */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 min-w-0">
                            {getPriorityPill(lead.priority)}

                            {lead.zone && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full truncate max-w-[130px]">
                                <MapPin className="size-2.5 text-slate-400 shrink-0" />
                                <span className="truncate">{lead.zone}</span>
                              </span>
                            )}
                          </div>

                          {/* 3 Dots Trigger to open Edit Sheet */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditSheet(lead);
                            }}
                            className="text-slate-400 hover:text-slate-800 hover:bg-slate-100 p-1 rounded-md transition-colors cursor-pointer"
                            title="Editar información del prospecto"
                          >
                            <MoreVertical className="size-3.5" />
                          </button>
                        </div>

                        {/* Company & Contact Name */}
                        <div>
                          <Link
                            href={`/internal/leads/${lead.id}`}
                            className="font-semibold text-[13px] text-slate-800 hover:text-blue-600 line-clamp-1 block transition-colors leading-snug"
                          >
                            {lead.companyName || lead.name}
                          </Link>
                          {lead.companyName && lead.name !== lead.companyName && (
                            <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                              Contacto: {lead.name}
                            </p>
                          )}
                        </div>

                        {/* Demo Web Preview Pill Button */}
                        {lead.previewUrl ? (
                          <a
                            href={lead.previewUrl.startsWith('http') ? lead.previewUrl : `https://${lead.previewUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-between gap-1.5 text-xs font-medium text-blue-600 bg-blue-50/70 hover:bg-blue-100/80 px-2.5 py-1 rounded-lg transition-colors w-full border border-blue-100/80"
                          >
                            <span className="truncate flex items-center gap-1">
                              <Sparkles className="size-3 text-amber-500 shrink-0" />
                              <span className="truncate">Ver Maqueta Web</span>
                            </span>
                            <ExternalLink className="size-3 shrink-0 opacity-70" />
                          </a>
                        ) : null}

                        {/* Progress Indicator */}
                        <div className="space-y-1 pt-0.5">
                          <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                            <span className="text-slate-400 font-normal">Embudo</span>
                            <span className="font-semibold text-slate-700">{progress}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${lead.status === 'WON'
                                ? 'bg-emerald-500'
                                : lead.status === 'LOST'
                                  ? 'bg-rose-400'
                                  : 'bg-indigo-600'
                                }`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>

                        {/* Card Footer: Date, Assigned Avatar & Convert Action */}
                        <div className="pt-2 border-t border-slate-100/80 flex items-center justify-between text-xs text-slate-400">
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                            <Calendar className="size-3.5 text-slate-400" />
                            <span>
                              {lead.createdAt
                                ? formatCompactDate(lead.createdAt)
                                : 'Feb 28'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {col.id === 'WON' ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedLeadForConvert(lead);
                                  setConvertProjectName(
                                    lead.companyName
                                      ? `Sitio Web - ${lead.companyName}`
                                      : `Sitio Web - ${lead.name}`
                                  );
                                  setConvertWorkerId(lead.assignedTo?.id || '');
                                  setConvertModalOpen(true);
                                }}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-lg shadow-xs transition-colors"
                              >
                                <Building2 className="size-3" />
                                Crear Proyecto
                              </button>
                            ) : (
                              <div
                                className="w-6 h-6 rounded-full bg-gradient-to-tr from-blue-400 to-indigo-500 border-2 border-white flex items-center justify-center text-[10px] font-bold text-white shadow-xs"
                                title={lead.assignedTo?.name || 'Responsable'}
                              >
                                {getInitials(lead.assignedTo?.name)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Lead Slide-Out Sheet */}
      <Sheet open={editSheetOpen} onOpenChange={setEditSheetOpen}>
        <SheetContent side="right" className="overflow-y-auto sm:max-w-lg">
          <SheetHeader className="border-b pb-4">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
                <Edit3 className="size-4" />
              </span>
              <div>
                <SheetTitle className="text-base font-bold text-slate-900">
                  Editar Información del Prospecto
                </SheetTitle>
                <SheetDescription className="text-xs text-slate-500">
                  Actualiza los datos del negocio, zona mapeada, demo web o etapa en el pipeline.
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          {selectedLeadForEdit && (
            <form onSubmit={handleEditSubmit} className="space-y-4 pt-2">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-xs font-semibold text-slate-700">
                  Nombre del Negocio / Empresa
                  <input
                    required
                    name="companyName"
                    defaultValue={selectedLeadForEdit.companyName || ''}
                    placeholder="Ej. Misha Coffe Lab"
                    className={field}
                  />
                </label>

                <label className="block text-xs font-semibold text-slate-700">
                  Persona de Contacto
                  <input
                    name="name"
                    defaultValue={selectedLeadForEdit.name || ''}
                    placeholder="Ej. Rodrigo Mendoza (Dueño)"
                    className={field}
                  />
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-xs font-semibold text-slate-700">
                  Zona / Territorio Mapeado
                  <input
                    name="zone"
                    defaultValue={selectedLeadForEdit.zone || ''}
                    placeholder="Ej. Miraflores - Cafeterías"
                    className={field}
                  />
                </label>

                <label className="block text-xs font-semibold text-slate-700">
                  Prioridad Comercial
                  <select
                    name="priority"
                    defaultValue={selectedLeadForEdit.priority || 'MEDIUM'}
                    className={field}
                  >
                    <option value="LOW">Low (Baja)</option>
                    <option value="MEDIUM">Medium (Media)</option>
                    <option value="HIGH">High (Alta)</option>
                    <option value="URGENT">Urgent (Urgente)</option>
                  </select>
                </label>
              </div>

              <label className="block text-xs font-semibold text-slate-700">
                URL de la Maqueta / Demo Web Desarrollada
                <input
                  name="previewUrl"
                  defaultValue={selectedLeadForEdit.previewUrl || ''}
                  placeholder="https://misha-coffee-demo.vercel.app"
                  className={field}
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-xs font-semibold text-slate-700">
                  Teléfono / WhatsApp
                  <input
                    name="phone"
                    type="tel"
                    defaultValue={selectedLeadForEdit.phone || ''}
                    placeholder="+51 999 888 777"
                    className={field}
                  />
                </label>

                <label className="block text-xs font-semibold text-slate-700">
                  Correo Electrónico
                  <input
                    name="email"
                    type="email"
                    defaultValue={selectedLeadForEdit.email || ''}
                    placeholder="contacto@mishacoffee.com"
                    className={field}
                  />
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-xs font-semibold text-slate-700">
                  Etapa en el Pipeline
                  <select
                    name="status"
                    defaultValue={selectedLeadForEdit.status}
                    className={field}
                  >
                    <option value="MAPPED">1. Mapeo en Zona</option>
                    <option value="SITE_DEVELOPMENT">2. En Desarrollo Autónomo</option>
                    <option value="PRESENTED">3. Contactado / Demo</option>
                    <option value="FEEDBACK_CHANGES">4. En Negociación</option>
                    <option value="WON">5. Aceptado / Ganado</option>
                    <option value="LOST">6. Rechazado</option>
                  </select>
                </label>

                <label className="block text-xs font-semibold text-slate-700">
                  Responsable Asignado
                  <select
                    name="assignedToId"
                    defaultValue={selectedLeadForEdit.assignedTo?.id || ''}
                    className={field}
                  >
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
                Tipo de Servicio Prospectado
                <select
                  name="type"
                  defaultValue={selectedLeadForEdit.type || 'LANDING'}
                  className={field}
                >
                  <option value="LANDING">Sitio Web / Landing Page</option>
                  <option value="SYSTEM">Software / Sistema a Medida</option>
                  <option value="MOBILE">Aplicación Móvil</option>
                  <option value="FOXROOMS">FoxRooms</option>
                  <option value="GENERAL">General</option>
                </select>
              </label>

              <label className="block text-xs font-semibold text-slate-700">
                Notas de Prospección / Observaciones
                <textarea
                  name="message"
                  rows={3}
                  defaultValue={selectedLeadForEdit.message || ''}
                  placeholder="Detalles sobre competidores de la zona, interés en pasarela de pagos, etc."
                  className={field}
                />
              </label>

              {editError && (
                <p role="alert" className="rounded-xl bg-destructive/10 p-3 text-xs text-destructive">
                  {editError}
                </p>
              )}

              {/* Bottom Sticky Action Buttons */}
              <div className="sticky bottom-0 flex items-center justify-between gap-2 border-t bg-white pt-4 mt-6">
                <Link
                  href={`/internal/leads/${selectedLeadForEdit.id}`}
                  className="text-xs font-semibold text-slate-600 hover:text-blue-600 underline"
                >
                  Ver Ficha Completa →
                </Link>

                <div className="flex items-center gap-2">
                  <SheetClose asChild>
                    <Button type="button" variant="outline" size="sm" className="rounded-xl">
                      Cancelar
                    </Button>
                  </SheetClose>
                  <Button
                    type="submit"
                    disabled={isPending}
                    size="sm"
                    className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium"
                  >
                    {isPending ? 'Guardando...' : 'Guardar Cambios'}
                  </Button>
                </div>
              </div>
            </form>
          )}
        </SheetContent>
      </Sheet>

      {/* Convert to Project Dialog */}
      {convertModalOpen && selectedLeadForConvert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl border bg-white p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between border-b pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="size-5 text-amber-500" />
                  Convertir Prospecto a Cliente y Proyecto
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Se creará el Cliente formal y un Proyecto de tipo Sitio Web con su primer Sprint activo.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setConvertModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConvertSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre del Proyecto
                </label>
                <input
                  required
                  value={convertProjectName}
                  onChange={(e) => setConvertProjectName(e.target.value)}
                  className="w-full rounded-xl border bg-slate-50 px-3.5 py-2 text-xs outline-none focus:bg-white focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Precio Total Acordado (USD)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={convertPrice}
                    onChange={(e) => setConvertPrice(e.target.value)}
                    className="w-full rounded-xl border bg-slate-50 px-3.5 py-2 text-xs outline-none focus:bg-white focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Responsable Asignado
                  </label>
                  <select
                    value={convertWorkerId}
                    onChange={(e) => setConvertWorkerId(e.target.value)}
                    className="w-full rounded-xl border bg-slate-50 px-3.5 py-2 text-xs outline-none focus:bg-white focus:ring-2 focus:ring-blue-600"
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

              <div className="rounded-xl border bg-slate-50 p-3.5 text-xs space-y-1 text-slate-600">
                <p className="font-semibold text-slate-800">Se generará automáticamente:</p>
                <p>✓ Cliente activo con datos de contacto y demo asociado.</p>
                <p>✓ Sprint 1: Setup & Kickoff (Estado: Activo).</p>
                <p>✓ Requerimiento REQ-01: Personalización y Despliegue de Sitio Web.</p>
              </div>

              {convertError && (
                <p className="rounded-xl bg-red-50 p-2.5 text-xs text-red-600 border border-red-200">
                  {convertError}
                </p>
              )}

              {convertSuccess && (
                <p className="rounded-xl bg-emerald-50 p-2.5 text-xs text-emerald-700 border border-emerald-200">
                  {convertSuccess}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onClick={() => setConvertModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  disabled={isPending}
                  type="submit"
                  size="sm"
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                >
                  {isPending ? 'Creando Proyecto...' : 'Confirmar y Crear Proyecto'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
