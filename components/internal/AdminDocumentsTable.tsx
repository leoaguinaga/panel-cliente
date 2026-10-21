'use client';

import { useState } from 'react';
import {
  DocumentPreviewModal,
  DocumentPreviewTarget,
} from '@/components/shared/DocumentPreviewModal';
import { formatDate } from '@/lib/formatters';
import { formatBytes } from '@/components/client/client-formatters';
import { getFilePreviewType } from '@/src/lib/file-preview-helpers';
import { Download, Eye } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { DocumentManageActions } from '@/components/documents/DocumentManageActions';
import { DOCUMENT_TYPE_LABELS, DocumentIcon } from '@/components/documents/document-meta';

export interface AdminDocumentItem {
  id: string;
  originalName: string;
  type: string;
  size: number;
  visibleToClient: boolean;
  archivedAt?: string | null;
  createdAt: string;
  client: { name: string; businessName: string | null } | null;
  project: { id: string; name: string } | null;
  uploadedBy: { name: string };
}

export function AdminDocumentsTable({
  documents,
}: {
  documents: AdminDocumentItem[];
}) {
  const [selectedDoc, setSelectedDoc] = useState<DocumentPreviewTarget | null>(null);

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-card shadow-xs">
        <div className="grid grid-cols-[minmax(14rem,1.4fr)_minmax(10rem,0.9fr)_auto] gap-4 border-b bg-slate-50/70 px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
          <span>Documento</span>
          <span>Contexto</span>
          <span className="text-right">Acciones</span>
        </div>

        <div className="divide-y divide-slate-100">
          {documents.map((doc) => {
            const previewType = getFilePreviewType(doc.originalName);
            const isPreviewable = previewType !== 'unsupported';

            return (
              <div
                key={doc.id}
                className="grid grid-cols-[minmax(14rem,1.4fr)_minmax(10rem,0.9fr)_auto] items-center gap-4 px-5 py-4 text-sm transition hover:bg-slate-50/80"
              >
                {/* Document name & metadata */}
                <div
                  className="flex min-w-0 cursor-pointer items-center gap-3"
                  onClick={() => setSelectedDoc(doc)}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 p-2 shadow-2xs">
                    <DocumentIcon name={doc.originalName} />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900 hover:text-orange-600">
                      {doc.originalName}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {DOCUMENT_TYPE_LABELS[doc.type] || doc.type} · {formatBytes(doc.size)} · Subido por{' '}
                      <strong className="text-slate-700">{doc.uploadedBy.name}</strong> el{' '}
                      {formatDate(doc.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Context */}
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-700">
                    {doc.project?.name ||
                      doc.client?.businessName ||
                      doc.client?.name ||
                      'Sin asociación'}
                  </p>
                  {doc.visibleToClient && (
                    <span className="mt-1 inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                      Visible para cliente
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    title={isPreviewable ? 'Vista previa' : 'Ver info'}
                    aria-label={`${isPreviewable ? 'Vista previa' : 'Ver info'} de ${doc.originalName}`}
                    onClick={() => setSelectedDoc(doc)}
                  >
                    <Eye aria-hidden />
                  </Button>
                  <a
                    href={`/api/backend/documents/${doc.id}/download`}
                    download={doc.originalName}
                    title="Descargar"
                    aria-label={`Descargar ${doc.originalName}`}
                    className={buttonVariants({ variant: 'ghost', size: 'icon-sm' })}
                  >
                    <Download aria-hidden />
                  </a>
                  <DocumentManageActions document={doc} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Document Preview Modal */}
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
