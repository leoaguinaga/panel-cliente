'use client';

import { DocumentActions } from './DocumentActions';
import { useState } from 'react';
import {
  DocumentPreviewModal,
  DocumentPreviewTarget,
} from '@/components/shared/DocumentPreviewModal';
import { formatDate } from '@/lib/formatters';
import { formatBytes } from '@/components/client/client-formatters';
import {
  getFilePreviewType,
  getFileExtension,
} from '@/src/lib/file-preview-helpers';
import {
  Archive,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  FileType,
  Film,
  Image as ImageIcon,
} from 'lucide-react';

const labels: Record<string, string> = {
  COMMERCIAL_PROPOSAL: 'Propuesta',
  SIGNED_CONTRACT: 'Contrato',
  INVOICE: 'Factura',
  PAYMENT_PROOF: 'Comprobante',
  DELIVERABLE: 'Entregable',
  INTERNAL_FILE: 'Interno',
  OTHER: 'Otro',
};

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

  const getDocIcon = (name: string) => {
    const previewType = getFilePreviewType(name);
    switch (previewType) {
      case 'docx':
        return <FileText size={18} className="text-blue-600" />;
      case 'image':
        return <ImageIcon size={18} className="text-emerald-600" />;
      case 'pdf':
        return <FileType size={18} className="text-red-600" />;
      default: {
        const ext = getFileExtension(name).toLowerCase();
        if (['xlsx', 'xls', 'csv'].includes(ext)) {
          return <FileSpreadsheet size={18} className="text-emerald-600" />;
        }
        if (['zip', 'rar', '7z'].includes(ext)) {
          return <Archive size={18} className="text-amber-600" />;
        }
        if (['mp4', 'mov'].includes(ext)) {
          return <Film size={18} className="text-purple-600" />;
        }
        return <FileText size={18} className="text-slate-500" />;
      }
    }
  };

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
                    {getDocIcon(doc.originalName)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900 hover:text-orange-600">
                      {doc.originalName}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {labels[doc.type] || doc.type} · {formatBytes(doc.size)} · Subido por{' '}
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
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedDoc(doc)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50"
                  >
                    <Eye size={13} />
                    <span>{isPreviewable ? 'Vista previa' : 'Ver info'}</span>
                  </button>

                  <a
                    href={`/api/backend/documents/${doc.id}/download`}
                    download={doc.originalName}
                    className="inline-flex items-center gap-1 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-slate-800"
                  >
                    <Download size={13} />
                    <span>Descargar</span>
                  </a>
                </div>
                <DocumentActions document={doc} />
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
