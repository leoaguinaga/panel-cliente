'use client';

import { useState, useTransition, useEffect, useRef } from 'react';
import { deleteTaskEvidenceAction } from '@/src/modules/projects/server/actions';
import { addTaskEvidenceAction } from '@/src/modules/projects/server/task-actions';
import type { TaskEvidence } from '@/src/modules/projects/types';
import { Button } from '@/components/ui/button';
import { Camera, ExternalLink, FileText, Image as ImageIcon, Link2, Trash2, Upload } from 'lucide-react';
import { formatDate } from '@/lib/formatters';

export type TaskEvidenceItem = TaskEvidence;
type Kind = TaskEvidence['kind'];

const EMPTY_EVIDENCES: TaskEvidenceItem[] = [];
const KINDS: Array<{ id: Kind; label: string; icon: typeof Link2 }> = [
  { id: 'LINK', label: 'Enlace', icon: Link2 },
  { id: 'IMAGE', label: 'Imagen', icon: ImageIcon },
  { id: 'NOTE', label: 'Nota', icon: FileText },
];

const isHttpUrl = (value: string) => /^https?:\/\/\S+$/i.test(value.trim());
const hostOf = (value: string) => {
  try {
    return new URL(value).hostname.replace(/^www\./, '');
  } catch {
    return value;
  }
};
const isEditable = (target: EventTarget | null) =>
  target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));

export function EvidenceModal({
  projectId,
  taskId,
  taskTitle,
  evidences = EMPTY_EVIDENCES,
  requiresEvidence = false,
  isOpen,
  onClose,
}: {
  projectId?: string;
  taskId: string;
  taskTitle: string;
  evidences: TaskEvidenceItem[];
  requiresEvidence?: boolean;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [items, setItems] = useState<TaskEvidenceItem[]>(evidences);
  const [kind, setKind] = useState<Kind>('LINK');
  const [title, setTitle] = useState('');
  const [link, setLink] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [dragging, setDragging] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const linkRef = useRef<HTMLInputElement>(null);

  const [previousEvidences, setPreviousEvidences] = useState(evidences);
  if (previousEvidences !== evidences) {
    setPreviousEvidences(evidences);
    setItems(evidences);
  }

  const readImage = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Ese archivo no es una imagen (PNG, JPG o WebP).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      setImage(event.target?.result as string);
      setKind('IMAGE');
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  // Cmd/Ctrl+V fuera de un campo: una imagen va a «Imagen» y una URL a «Enlace».
  useEffect(() => {
    if (!isOpen) return;
    const handlePaste = (e: ClipboardEvent) => {
      const file = Array.from(e.clipboardData?.items || [])
        .find((item) => item.type.startsWith('image/'))
        ?.getAsFile();
      if (file) {
        e.preventDefault();
        readImage(file);
        return;
      }
      if (isEditable(e.target)) return;
      const pasted = e.clipboardData?.getData('text')?.trim() || '';
      if (isHttpUrl(pasted)) {
        e.preventDefault();
        setKind('LINK');
        setLink(pasted);
        setError(null);
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    // En captura: Escape cierra solo este modal, no el detalle de la tarea de abajo.
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      onClose();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const ready = kind === 'LINK' ? isHttpUrl(link) : kind === 'IMAGE' ? Boolean(image) : Boolean(notes.trim());

  const reset = () => {
    setTitle('');
    setLink('');
    setImage(null);
    setNotes('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ready) {
      setError(
        kind === 'LINK'
          ? 'Pega un enlace que empiece con http:// o https://'
          : kind === 'IMAGE'
            ? 'Adjunta o pega una imagen (Cmd/Ctrl+V)'
            : 'Escribe la nota',
      );
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await addTaskEvidenceAction(projectId ?? '', taskId, {
        kind,
        title: title.trim() || undefined,
        fileUrl: kind === 'LINK' ? link.trim() : kind === 'IMAGE' ? image! : undefined,
        notes: notes.trim() || undefined,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      const created = result.evidence;
      if (created) setItems((prev) => [created, ...prev.filter((it) => it.id !== created.id)]);
      reset();
    });
  };

  const handleDelete = (evidenceId: string) => {
    startTransition(async () => {
      try {
        await deleteTaskEvidenceAction(projectId ?? '', taskId, evidenceId);
        setItems((prev) => prev.filter((it) => it.id !== evidenceId));
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error al eliminar');
      }
    });
  };

  const field = 'w-full rounded-md border bg-card px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary';

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 pt-[10vh]" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="evidence-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl rounded-xl border bg-card shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4 bg-slate-50">
          <div className="min-w-0">
            <h3 id="evidence-title" className="font-bold text-base text-slate-900 flex items-center gap-2">
              <Camera className="w-5 h-5 text-blue-600" aria-hidden="true" />
              Evidencias de cumplimiento
            </h3>
            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
              Tarea: <span className="font-medium text-slate-800">{taskTitle}</span>
              {requiresEvidence && (
                <span className={`ml-2 rounded px-1.5 py-0.5 text-[10px] font-semibold ${items.length ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                  {items.length ? 'Requisito cumplido' : 'Requerida para terminar'}
                </span>
              )}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="text-slate-400 hover:text-slate-600 text-lg p-1">
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div role="tablist" aria-label="Tipo de evidencia" className="inline-flex rounded-lg border bg-card p-0.5">
                {KINDS.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={kind === id}
                    onClick={() => {
                      setKind(id);
                      setError(null);
                      if (id === 'LINK') requestAnimationFrame(() => linkRef.current?.focus());
                    }}
                    className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${kind === id ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    <Icon className="size-3.5" aria-hidden="true" />
                    {label}
                  </button>
                ))}
              </div>
              <span className="text-[11px] text-muted-foreground">
                Pega con <b>Cmd/Ctrl+V</b>: una URL o una captura
              </span>
            </div>

            {kind === 'LINK' && (
              <input
                ref={linkRef}
                type="url"
                inputMode="url"
                autoFocus
                placeholder="https://… (PR, commit, deploy, documento)"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                className={field}
              />
            )}

            {kind === 'IMAGE' &&
              (image ? (
                <div className="relative rounded-lg border overflow-hidden bg-black/5 max-h-48 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image} alt="Vista previa" className="max-h-48 object-contain" />
                  <button
                    type="button"
                    onClick={() => setImage(null)}
                    className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded shadow-md text-xs hover:bg-red-700"
                  >
                    Quitar
                  </button>
                </div>
              ) : (
                <label
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragging(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) readImage(file);
                  }}
                  className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-colors ${dragging ? 'border-blue-400 bg-blue-50/40' : 'border-slate-200 hover:bg-blue-50/40 hover:border-blue-300'}`}
                >
                  <Upload className="w-7 h-7 text-slate-400 mb-2" aria-hidden="true" />
                  <span className="text-xs font-medium text-slate-700">Selecciona, arrastra o pega una imagen</span>
                  <span className="text-[11px] text-slate-400 mt-0.5">PNG, JPG o WebP</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) readImage(file);
                      e.target.value = '';
                    }}
                    className="hidden"
                  />
                </label>
              ))}

            {kind === 'NOTE' ? (
              <>
                <textarea
                  autoFocus
                  rows={4}
                  placeholder="¿Qué se hizo y cómo se comprobó? (ej. Probado con el cliente en llamada, aprobó el flujo)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className={`${field} resize-y`}
                />
                <input placeholder="Título (opcional)" value={title} onChange={(e) => setTitle(e.target.value)} className={field} />
              </>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  placeholder={kind === 'LINK' ? 'Título (opcional, por defecto el enlace)' : 'Título (opcional)'}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={field}
                />
                <input placeholder="Nota (opcional)" value={notes} onChange={(e) => setNotes(e.target.value)} className={field} />
              </div>
            )}

            {error && <p role="alert" className="text-xs text-red-600">{error}</p>}

            <div className="flex justify-end pt-1">
              <Button disabled={isPending || !ready} type="submit" size="sm" className="bg-brand-button hover:bg-brand-hover text-white text-xs">
                {isPending ? 'Guardando...' : 'Guardar evidencia'}
              </Button>
            </div>
          </form>

          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Evidencias registradas ({items.length})</h4>

            {items.length === 0 ? (
              <p className="text-center py-6 text-xs text-muted-foreground border rounded-lg bg-slate-50">
                Aún no hay evidencias. Un enlace al PR o al deploy, una captura o una nota bastan.
              </p>
            ) : (
              <ul className="space-y-2">
                {items.map((ev) => (
                  <EvidenceRow key={ev.id} evidence={ev} onDelete={() => handleDelete(ev.id)} disabled={isPending} />
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="border-t px-6 py-3 bg-slate-50 flex justify-end">
          <Button type="button" variant="outline" onClick={onClose} size="sm">
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
}

function EvidenceRow({ evidence: ev, onDelete, disabled }: { evidence: TaskEvidenceItem; onDelete: () => void; disabled: boolean }) {
  const kind = ev.kind;
  const Icon = kind === 'LINK' ? Link2 : kind === 'NOTE' ? FileText : ImageIcon;
  return (
    <li className="flex items-start gap-3 rounded-lg border bg-card p-3">
      {kind === 'IMAGE' && ev.fileUrl ? (
        <a href={ev.fileUrl} target="_blank" rel="noopener noreferrer" className="shrink-0 overflow-hidden rounded border bg-slate-100" title="Ver completa">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ev.fileUrl} alt={ev.title || 'Evidencia'} className="size-16 object-cover" />
        </a>
      ) : (
        <span className="flex size-9 shrink-0 items-center justify-center rounded-md border bg-slate-50 text-slate-500">
          <Icon className="size-4" aria-hidden="true" />
        </span>
      )}
      <div className="min-w-0 flex-1">
        {kind === 'LINK' && ev.fileUrl ? (
          <a href={ev.fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex max-w-full items-center gap-1 text-xs font-semibold text-slate-900 hover:underline">
            <span className="truncate">{ev.title || hostOf(ev.fileUrl)}</span>
            <ExternalLink className="size-3 shrink-0 text-slate-400" aria-hidden="true" />
          </a>
        ) : (
          <p className="text-xs font-semibold text-slate-900 line-clamp-1">{ev.title || 'Evidencia'}</p>
        )}
        {kind === 'LINK' && ev.fileUrl && <p className="truncate text-[11px] text-slate-400">{hostOf(ev.fileUrl)}</p>}
        {ev.notes && <p className={`text-[11px] text-slate-500 ${kind === 'NOTE' ? 'whitespace-pre-wrap' : 'line-clamp-2'}`}>{ev.notes}</p>}
        <p className="text-[10px] text-slate-400 mt-1">
          {ev.uploadedBy?.name || 'Equipo'} · {formatDate(ev.createdAt)}
        </p>
      </div>
      <button type="button" onClick={onDelete} disabled={disabled} className="text-slate-300 hover:text-red-600 p-1 transition-colors" title="Eliminar evidencia" aria-label="Eliminar evidencia">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </li>
  );
}
