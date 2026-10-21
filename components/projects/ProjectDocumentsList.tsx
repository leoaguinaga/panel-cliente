'use client';

import { useState } from 'react';
import { Download, Eye, EyeOff } from 'lucide-react';
import type { ProjectDocument } from '@/src/modules/projects/types';
import {
  DocumentPreviewModal,
  DocumentPreviewTarget,
} from '@/components/shared/DocumentPreviewModal';
import { DocumentManageActions } from '@/components/documents/DocumentManageActions';
import { DOCUMENT_TYPE_LABELS, DocumentIcon } from '@/components/documents/document-meta';
import { Button, buttonVariants } from '@/components/ui/button';
import { formatBytes } from '@/components/client/client-formatters';
import { formatDate } from '@/lib/formatters';

export function ProjectDocumentsList({
  documents,
  empty,
}: {
  documents: ProjectDocument[];
  empty: string;
}) {
  const [selectedDoc, setSelectedDoc] = useState<DocumentPreviewTarget | null>(null);

  if (documents.length === 0)
    return (
      <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-slate-500">
        {empty}
      </div>
    );

  return (
    <>
      <ul className="divide-y overflow-hidden rounded-2xl border bg-card">
        {documents.map((document) => (
          <li
            key={document.id}
            className="flex flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3 transition-colors hover:bg-slate-50/60"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-100">
              <DocumentIcon name={document.originalName} mimeType={document.mimeType} />
            </span>

            <div className="min-w-0 flex-1 basis-56">
              <button
                type="button"
                onClick={() => setSelectedDoc(document)}
                className="block max-w-full truncate rounded text-left text-sm font-semibold text-slate-900 hover:text-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {document.originalName}
              </button>
              <p className="mt-0.5 truncate text-xs text-slate-500">
                {DOCUMENT_TYPE_LABELS[document.type] || document.type} · {formatBytes(document.size)} ·{' '}
                {document.uploadedBy.name} · {formatDate(document.createdAt)}
              </p>
            </div>

            {document.visibleToClient ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                <Eye size={12} aria-hidden />
                Visible al cliente
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                <EyeOff size={12} aria-hidden />
                Solo equipo
              </span>
            )}

            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                title="Vista previa"
                aria-label={`Vista previa de ${document.originalName}`}
                onClick={() => setSelectedDoc(document)}
              >
                <Eye aria-hidden />
              </Button>
              <a
                href={`/api/backend/documents/${document.id}/download`}
                download={document.originalName}
                title="Descargar"
                aria-label={`Descargar ${document.originalName}`}
                className={buttonVariants({ variant: 'ghost', size: 'icon-sm' })}
              >
                <Download aria-hidden />
              </a>
              <DocumentManageActions document={document} />
            </div>
          </li>
        ))}
      </ul>

      {selectedDoc && (
        <DocumentPreviewModal
          document={selectedDoc}
          isOpen={Boolean(selectedDoc)}
          onClose={() => setSelectedDoc(null)}
        />
      )}
    </>
  );
}
