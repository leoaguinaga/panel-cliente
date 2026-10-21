import { Paperclip, X } from 'lucide-react';
import type { DeliverableAttachment } from '@/src/modules/projects/types';

export function DeliverableAttachmentList({ attachments, projectId, pending, onRemove }: {
  attachments: DeliverableAttachment[]; projectId?: string; pending?: boolean;
  onRemove?: (id: string) => void;
}) {
  if (!attachments.length) return null;
  return <ul className="space-y-2" aria-label="Material del entregable">
    {attachments.map(item => {
      const document = item.document && !item.document.archivedAt ? item.document : null;
      const url = document ? `/api/backend/documents/${document.id}/download` : item.kind === 'DOCUMENT' ? null : item.url;
      const downloadableImage = item.kind === 'IMAGE' && url?.startsWith('data:image/');
      return <li key={item.id} className="flex min-w-0 items-start gap-2 text-xs">
        <Paperclip className="mt-2 size-3.5 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          {url ? <a href={url} download={downloadableImage ? 'imagen-entregable' : undefined} target={document || downloadableImage ? undefined : '_blank'} rel="noopener noreferrer" className="inline-flex min-h-9 items-center break-all font-medium text-blue-700 underline-offset-4 hover:underline">{item.title}</a> : <p className="py-2 font-medium break-words">{item.title}{item.kind === 'DOCUMENT' ? ' · Archivo no disponible' : ''}</p>}
          {item.notes && <p className="whitespace-pre-wrap break-words text-muted-foreground">{item.notes}</p>}
          {projectId && item.sourceTaskId && <a href={`/internal/projects/${projectId}/tasks/kanban?task=${item.sourceTaskId}`} className="mt-1 inline-block max-w-full break-words text-muted-foreground underline underline-offset-4">De tarea: {item.sourceTaskTitle || 'Ver origen'}</a>}
        </div>
        {onRemove && <button type="button" disabled={pending} onClick={() => onRemove(item.id)} aria-label={`Quitar adjunto ${item.title}`} className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-destructive disabled:opacity-50"><X className="size-4" /></button>}
      </li>;
    })}
  </ul>;
}
