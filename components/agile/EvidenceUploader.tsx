'use client';

import { useState, useTransition, useEffect } from 'react';
import { addTaskEvidenceAction, deleteTaskEvidenceAction } from '@/src/modules/projects/server/actions';
import { Button } from '@/components/ui/button';
import { Camera, Image as ImageIcon, Trash2, Upload, Sparkles, CheckCircle2, FileText } from 'lucide-react';
import { formatDate } from '@/lib/formatters';

export type TaskEvidenceItem = {
  id: string;
  title: string | null;
  fileUrl: string;
  notes: string | null;
  createdAt: string;
  uploadedBy?: { id: string; name: string } | null;
};

export function EvidenceModal({
  projectId,
  taskId,
  taskTitle,
  evidences = [],
  isOpen,
  onClose,
}: {
  projectId: string;
  taskId: string;
  taskTitle: string;
  evidences: TaskEvidenceItem[];
  isOpen: boolean;
  onClose: () => void;
}) {
  const [items, setItems] = useState<TaskEvidenceItem[]>(evidences);
  const [title, setTitle] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setItems(evidences);
  }, [evidences]);

  // Handle Ctrl+V / Clipboard Paste of Screenshot
  useEffect(() => {
    if (!isOpen) return;
    const handlePaste = (e: ClipboardEvent) => {
      const clipboardItems = e.clipboardData?.items;
      if (!clipboardItems) return;

      for (let i = 0; i < clipboardItems.length; i++) {
        const item = clipboardItems[i];
        if (item.type.indexOf('image') !== -1) {
          const blob = item.getAsFile();
          if (blob) {
            const reader = new FileReader();
            reader.onload = (event) => {
              const base64 = event.target?.result as string;
              setPreviewImage(base64);
              setFileUrl(base64);
              if (!title) setTitle(`Captura de pantalla ${new Date().toLocaleTimeString()}`);
            };
            reader.readAsDataURL(blob);
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen, title]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setPreviewImage(base64);
        setFileUrl(base64);
        if (!title) setTitle(file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileUrl) {
      setError('Por favor sube una captura o pega una imagen del portapapeles (Ctrl+V)');
      return;
    }
    setError(null);

    const formData = new FormData();
    formData.append('title', title || 'Evidencia de cumplimiento');
    formData.append('fileUrl', fileUrl);
    formData.append('notes', notes);

    startTransition(async () => {
      try {
        await addTaskEvidenceAction(projectId, taskId, formData);
        setPreviewImage(null);
        setFileUrl('');
        setTitle('');
        setNotes('');
      } catch (err: any) {
        setError(err?.message || 'Error al guardar evidencia');
      }
    });
  };

  const handleDelete = (evidenceId: string) => {
    startTransition(async () => {
      try {
        await deleteTaskEvidenceAction(projectId, taskId, evidenceId);
        setItems((prev) => prev.filter((it) => it.id !== evidenceId));
      } catch (err: any) {
        setError(err?.message || 'Error al eliminar');
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-xl border bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4 bg-slate-50">
          <div>
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <Camera className="w-5 h-5 text-blue-600" />
              Evidencias de Cumplimiento
            </h3>
            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
              Tarea: <span className="font-medium text-slate-800">{taskTitle}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-lg p-1"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Upload / Paste Area */}
          <form onSubmit={handleSubmit} className="rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Adjuntar Captura de Pantalla
              </span>
              <span className="text-[11px] text-muted-foreground bg-white px-2 py-0.5 rounded border">
                Tip: Presiona <b>Ctrl+V</b> / <b>Cmd+V</b> para pegar captura directa
              </span>
            </div>

            {/* Drop / Preview Container */}
            {previewImage ? (
              <div className="relative rounded-lg border overflow-hidden bg-slate-900/5 max-h-48 flex items-center justify-center group">
                <img src={previewImage} alt="Preview" className="max-h-48 object-contain" />
                <button
                  type="button"
                  onClick={() => {
                    setPreviewImage(null);
                    setFileUrl('');
                  }}
                  className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded shadow-md text-xs hover:bg-red-700"
                >
                  Quitar captura
                </button>
              </div>
            ) : (
              <label className="border-2 border-dashed border-slate-200 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50/40 hover:border-blue-300 transition-colors">
                <Upload className="w-8 h-8 text-slate-400 mb-2" />
                <span className="text-xs font-medium text-slate-700">
                  Haz clic para seleccionar imagen o arrastra el archivo
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5">PNG, JPG, WebP o pega directamente</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                placeholder="Título o concepto (ej. Deploy en Vercel)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="rounded-md border bg-white px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-primary"
              />
              <input
                placeholder="Notas u observaciones adicionales..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="rounded-md border bg-white px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {error && <p className="text-xs text-red-600">{error}</p>}

            <div className="flex justify-end pt-1">
              <Button disabled={isPending || !fileUrl} type="submit" size="sm" className="bg-slate-900 hover:bg-black text-white text-xs">
                {isPending ? 'Guardando...' : 'Guardar Evidencia'}
              </Button>
            </div>
          </form>

          {/* List of existing evidences */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center justify-between">
              <span>Evidencias Registradas ({items.length})</span>
            </h4>

            {items.length === 0 ? (
              <p className="text-center py-6 text-xs text-muted-foreground border rounded-lg bg-slate-50">
                Aún no hay evidencias cargadas para esta tarea. Sube una captura para validar su cumplimiento.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {items.map((ev) => (
                  <div key={ev.id} className="rounded-lg border bg-white p-3 shadow-xs space-y-2 group relative">
                    <div className="relative rounded overflow-hidden bg-slate-100 h-36 flex items-center justify-center border">
                      <img
                        src={ev.fileUrl}
                        alt={ev.title || 'Evidencia'}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <a
                        href={ev.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center text-white opacity-0 group-hover:opacity-100 font-medium text-xs gap-1"
                      >
                        <ImageIcon className="w-4 h-4" /> Ver completa
                      </a>
                    </div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-semibold text-slate-900 line-clamp-1">{ev.title || 'Evidencia'}</p>
                        {ev.notes && <p className="text-[11px] text-slate-500 line-clamp-2">{ev.notes}</p>}
                        <p className="text-[10px] text-slate-400 mt-1">
                          Subido por: {ev.uploadedBy?.name || 'Equipo'} · {formatDate(ev.createdAt)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDelete(ev.id)}
                        className="text-slate-300 hover:text-red-600 p-1 transition-colors"
                        title="Eliminar evidencia"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-3 bg-slate-50 flex justify-end">
          <Button type="button" variant="outline" onClick={onClose} size="sm">
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
}
