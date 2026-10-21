'use client';

import { useState, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Link2, ListChecks, LoaderCircle, Paperclip, Upload } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { DeliverableAttachmentList } from './DeliverableAttachmentList';
import type { MilestoneDeliverable, ProjectMilestone } from '@/src/modules/projects/types';

type Document = { id: string; originalName: string };
type Mode = 'upload' | 'document' | 'link' | 'evidence';
const MAX_BYTES = 25 * 1024 * 1024;
const field = 'min-h-10 w-full min-w-0 rounded-xl border bg-card px-3 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary';
const submit = 'inline-flex min-h-10 shrink-0 items-center rounded-xl border px-3 text-xs font-semibold hover:bg-muted disabled:opacity-50';
const MODES: { id: Mode; label: string; icon: typeof Upload }[] = [
  { id: 'upload', label: 'Subir', icon: Upload },
  { id: 'document', label: 'Del proyecto', icon: FileText },
  { id: 'link', label: 'Enlace', icon: Link2 },
  { id: 'evidence', label: 'Evidencia', icon: ListChecks },
];

async function readError(response: Response) {
  const body = await response.json().catch(() => null);
  const message = body?.error || body?.message;
  return Array.isArray(message) ? message.join('. ') : typeof message === 'string' ? message : null;
}

export function DeliverableAttachments({ projectId, milestone, deliverable, documents }: {
  projectId: string; milestone: ProjectMilestone; deliverable: MilestoneDeliverable; documents: Document[];
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>('upload');
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState<{ name: string; index: number; total: number } | null>(null);
  const [pending, start] = useTransition();
  const [feedback, setFeedback] = useState<{ error: boolean; text: string } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const base = `/api/backend/projects/${projectId}/deliverables/${deliverable.id}/attachments`;
  const selected = new Set(deliverable.attachments?.map(item => item.sourceEvidenceId).filter(Boolean));
  const evidences = (milestone.tasks ?? []).flatMap(task => (task.evidences ?? []).filter(item => !selected.has(item.id)).map(item => ({ ...item, taskTitle: task.title || 'Tarea' })));

  function send(url: string, init: RequestInit, success: string) {
    setFeedback(null);
    start(async () => {
      try {
        const response = await fetch(url, init);
        if (!response.ok) {
          setFeedback({ error: true, text: await readError(response) || 'No se pudo guardar el adjunto. Vuelve a intentarlo.' });
          return;
        }
        setFeedback({ error: false, text: success });
        formRef.current?.reset();
        router.refresh();
      } catch {
        setFeedback({ error: true, text: 'No se pudo conectar. Vuelve a intentarlo.' });
      }
    });
  }

  function uploadFiles(list: FileList | null) {
    const files = Array.from(list ?? []).filter(file => file.size > 0);
    if (!files.length || pending) return;
    const tooBig = files.filter(file => file.size > MAX_BYTES).map(file => file.name);
    const queue = files.filter(file => file.size <= MAX_BYTES);
    setFeedback(null);
    if (!queue.length) {
      setFeedback({ error: true, text: tooBig.length > 1 ? 'Los archivos superan el límite de 25 MB.' : `«${tooBig[0]}» supera el límite de 25 MB.` });
      return;
    }
    start(async () => {
      const failed: string[] = [];
      let lastError: string | null = null;
      for (const [index, file] of queue.entries()) {
        setUploading({ name: file.name, index: index + 1, total: queue.length });
        const body = new FormData();
        body.set('file', file);
        try {
          const response = await fetch(`${base}/upload`, { method: 'POST', body });
          if (!response.ok) { failed.push(file.name); lastError = await readError(response); }
        } catch {
          failed.push(file.name);
          lastError = 'No se pudo conectar.';
        }
      }
      setUploading(null);
      const uploaded = queue.length - failed.length;
      const skipped = [...tooBig, ...failed];
      if (!skipped.length) setFeedback({ error: false, text: uploaded > 1 ? `${uploaded} archivos adjuntados.` : 'Archivo adjuntado.' });
      else if (!uploaded && queue.length === 1 && !tooBig.length) setFeedback({ error: true, text: lastError || 'No se pudo subir el archivo. Vuelve a intentarlo.' });
      else setFeedback({ error: true, text: `${uploaded ? `${uploaded} adjuntado${uploaded > 1 ? 's' : ''}. ` : ''}No se pudo subir: ${skipped.join(', ')}${tooBig.length ? ' (límite 25 MB)' : ''}.` });
      if (uploaded) router.refresh();
    });
  }

  return <div className="space-y-2">
    <DeliverableAttachmentList attachments={deliverable.attachments ?? []} projectId={projectId} pending={pending} onRemove={id => send(`${base}/${id}`, { method: 'DELETE' }, 'Adjunto quitado. El archivo o evidencia original se conserva.')} />
    <Sheet open={open} onOpenChange={value => { setOpen(value); setFeedback(null); }}>
      <SheetTrigger asChild>
        <button type="button" className="inline-flex min-h-9 items-center gap-1.5 rounded-lg text-xs font-medium text-blue-700 hover:text-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
          <Paperclip className="size-3.5" />Adjuntar material
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="@container overflow-y-auto">
      <SheetHeader>
        <SheetTitle>Adjuntar material</SheetTitle>
        <SheetDescription className="break-words">{deliverable.title}</SheetDescription>
      </SheetHeader>
      <DeliverableAttachmentList attachments={deliverable.attachments ?? []} projectId={projectId} pending={pending} onRemove={id => send(`${base}/${id}`, { method: 'DELETE' }, 'Adjunto quitado. El archivo o evidencia original se conserva.')} />
      <div className="space-y-3">
      <div role="radiogroup" aria-label="Origen del material" className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 @sm:grid-cols-4">
        {MODES.map(({ id, label, icon: Icon }) => <button key={id} type="button" role="radio" aria-checked={mode === id} disabled={pending} onClick={() => { setMode(id); setFeedback(null); }} className={`inline-flex min-h-9 min-w-0 items-center justify-center gap-1.5 rounded-lg px-1.5 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60 ${mode === id ? 'bg-card text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
          <Icon className="size-3.5 shrink-0" /><span className="truncate">{label}</span>
        </button>)}
      </div>

      {mode === 'upload' ? <label
        onDragOver={event => { event.preventDefault(); if (!pending) setDragging(true); }}
        onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragging(false); }}
        onDrop={event => { event.preventDefault(); setDragging(false); uploadFiles(event.dataTransfer.files); }}
        aria-busy={pending}
        className={`flex min-h-28 flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-5 text-center text-xs transition-colors focus-within:ring-2 focus-within:ring-primary ${pending ? 'cursor-progress border-slate-300' : 'cursor-pointer'} ${dragging ? 'border-blue-600 bg-blue-50' : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'}`}
      >
        <input type="file" multiple disabled={pending} className="sr-only" onChange={event => { uploadFiles(event.target.files); event.target.value = ''; }} />
        {uploading ? <>
          <LoaderCircle className="size-5 animate-spin text-blue-700 motion-reduce:animate-none" aria-hidden />
          <span className="max-w-full truncate font-medium text-slate-900" role="status">Subiendo {uploading.name}</span>
          {uploading.total > 1 && <span className="text-slate-500">{uploading.index} de {uploading.total}</span>}
        </> : <>
          <span className={`inline-flex size-9 items-center justify-center rounded-full ${dragging ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}><Upload className="size-4" aria-hidden /></span>
          <span className="text-slate-700">{dragging ? 'Suelta para adjuntar' : <>Arrastra archivos aquí o <span className="font-semibold text-blue-700 underline underline-offset-4">elige del equipo</span></>}</span>
          <span className="text-slate-500">Hasta 25 MB cada uno. Se suben al soltarlos.</span>
        </>}
      </label> : <form ref={formRef} aria-busy={pending} onSubmit={event => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const body = mode === 'document' ? { documentId: data.get('documentId') } : mode === 'evidence' ? { evidenceId: data.get('evidenceId') } : { url: data.get('url'), title: data.get('title') };
        send(base, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }, 'Material adjuntado.');
      }}>
        <fieldset disabled={pending} className="min-w-0 space-y-2 text-xs disabled:opacity-60">
          {mode === 'document' && (documents.length
            ? <div className="flex gap-2"><select aria-label="Documento del proyecto" name="documentId" required className={field}><option value="">Elegir documento</option>{documents.map(doc => <option key={doc.id} value={doc.id}>{doc.originalName}</option>)}</select><button className={submit}>{pending ? 'Guardando…' : 'Adjuntar'}</button></div>
            : <p className="py-2 text-slate-500">Este proyecto aún no tiene documentos. Usa «Subir».</p>)}
          {mode === 'link' && <>
            <input aria-label="Enlace" name="url" type="url" required maxLength={2000} placeholder="https://…" className={field} />
            <div className="flex gap-2"><input aria-label="Nombre del enlace (opcional)" name="title" maxLength={200} placeholder="Nombre (opcional), p. ej. Prototipo aprobado" className={field} /><button className={submit}>{pending ? 'Guardando…' : 'Adjuntar'}</button></div>
          </>}
          {mode === 'evidence' && (evidences.length
            ? <>
              <div className="flex gap-2"><select aria-label="Evidencia" name="evidenceId" required className={field}><option value="">Elegir evidencia</option>{evidences.map(item => <option key={item.id} value={item.id}>{item.taskTitle} · {item.title || item.notes?.slice(0, 80) || 'Imagen'}</option>)}</select><button className={submit}>{pending ? 'Guardando…' : 'Adjuntar'}</button></div>
              <p className="text-slate-500">Se guarda una copia y la referencia a la tarea de origen.</p>
            </>
            : <p className="py-2 text-slate-500">No hay evidencias pendientes en las tareas de este hito.</p>)}
        </fieldset>
      </form>}
      <p className="text-[11px] leading-4 text-slate-500">El cliente verá este material cuando el hito sea visible. Las demás evidencias de tareas siguen siendo internas.</p>
      {feedback && <p role={feedback.error ? 'alert' : 'status'} className={`break-words text-xs ${feedback.error ? 'text-destructive' : 'text-muted-foreground'}`}>{feedback.text}</p>}
      </div>
      </SheetContent>
    </Sheet>
    {feedback && !open && <p role={feedback.error ? 'alert' : 'status'} className={`break-words text-xs ${feedback.error ? 'text-destructive' : 'text-muted-foreground'}`}>{feedback.text}</p>}
  </div>;
}
