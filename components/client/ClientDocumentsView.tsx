'use client';

import { useState } from 'react';
import {
  DocumentPreviewModal,
  DocumentPreviewTarget,
} from '@/components/shared/DocumentPreviewModal';
import {
  documentType,
  formatBytes,
  formatDate,
} from '@/components/client/client-formatters';
import {
  getFilePreviewType,
  getFileExtension,
} from '@/src/lib/file-preview-helpers';
import {
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  FileType,
  Image as ImageIcon,
  Archive,
  Film,
} from 'lucide-react';

interface DocumentItem {
  id: string;
  originalName: string;
  type: string;
  size: number;
  createdAt: string;
  project: { name: string } | null;
}

export function ClientDocumentsView({
  documents,
}: {
  documents: DocumentItem[];
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

  if (documents.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-card p-10 text-center">
        <FileText className="mx-auto mb-4 text-slate-400" />
        <h2 className="font-semibold text-slate-900">No hay documentos disponibles</h2>
        <p className="mt-2 text-sm text-slate-600">
          Te avisaremos cuando se comparta un nuevo archivo.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-card shadow-xs">
        <div className="hidden grid-cols-[1fr_180px_120px_110px] gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-semibold text-slate-500 sm:grid">
          <span>Documento</span>
          <span>Tipo</span>
          <span>Fecha</span>
          <span className="text-right">Acciones</span>
        </div>

        <div className="divide-y divide-slate-100">
          {documents.map((document) => {
            const previewType = getFilePreviewType(document.originalName);
            const isPreviewable = previewType !== 'unsupported';

            return (
              <div
                key={document.id}
                className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 last:border-0 sm:grid sm:grid-cols-[1fr_180px_120px_110px] sm:items-center sm:gap-4 sm:px-5"
              >
                <div
                  className="flex min-w-0 cursor-pointer items-center gap-3"
                  onClick={() => setSelectedDoc(document)}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 p-2">
                    {getDocIcon(document.originalName)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900 hover:text-orange-600">
                      {document.originalName}
                    </p>
                    <p className="text-xs text-slate-500">
                      {document.project?.name || 'Documento general'} · {formatBytes(document.size)}
                    </p>
                  </div>
                </div>

                <span className="text-xs text-slate-600 sm:text-sm">
                  {documentType[document.type] || document.type}
                </span>

                <span className="text-xs text-slate-600 sm:text-sm">
                  {formatDate(document.createdAt)}
                </span>

                <div className="flex items-center justify-end gap-1">
                  {/* Preview Button */}
                  <button
                    type="button"
                    onClick={() => setSelectedDoc(document)}
                    className="inline-flex items-center gap-1 rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950"
                    title={isPreviewable ? 'Previsualizar documento' : 'Ver detalles y descargar'}
                  >
                    <Eye size={17} />
                  </button>

                  {/* Direct Download Link */}
                  <a
                    href={`/api/backend/documents/${document.id}/download`}
                    download={document.originalName}
                    aria-label={`Descargar ${document.originalName}`}
                    className="inline-flex items-center gap-1 rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950"
                    title="Descargar archivo"
                  >
                    <Download size={17} />
                    <span className="sr-only">Descargar</span>
                  </a>
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
