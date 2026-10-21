'use client';

import { useState, useEffect, useRef } from 'react';
import {
  getFilePreviewType,
  getFileExtension,
  getFileTypeLabel,
  PreviewableType,
} from '@/src/lib/file-preview-helpers';
import { formatBytes } from '@/components/client/client-formatters';
import {
  Download,
  ExternalLink,
  FileCode,
  FileSpreadsheet,
  FileText,
  FileType,
  Image as ImageIcon,
  Loader2,
  Maximize2,
  Minimize2,
  RefreshCw,
  RotateCw,
  X,
  ZoomIn,
  ZoomOut,
  Archive,
  Film,
  Music,
} from 'lucide-react';

export interface DocumentPreviewTarget {
  id: string;
  originalName: string;
  mimeType?: string;
  size?: number;
  url?: string;
  project?: { name: string } | null;
  uploadedBy?: { name: string } | null;
  createdAt?: string | null;
}

interface DocumentPreviewModalProps {
  document: DocumentPreviewTarget | null;
  isOpen: boolean;
  onClose: () => void;
}

export function DocumentPreviewModal({
  document,
  isOpen,
  onClose,
}: DocumentPreviewModalProps) {
  const [docxHtml, setDocxHtml] = useState<string | null>(null);
  const [docxLoading, setDocxLoading] = useState(false);
  const [docxError, setDocxError] = useState<string | null>(null);

  // Image & Zoom controls
  const [imageZoom, setImageZoom] = useState(1);
  const [imageRotation, setImageRotation] = useState(0);
  const [docxZoom, setDocxZoom] = useState(100);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const documentKey = isOpen && document ? document.id : null;
  const [previousDocumentKey, setPreviousDocumentKey] = useState<string | null>(null);
  if (documentKey !== previousDocumentKey) {
    setPreviousDocumentKey(documentKey);
    setDocxHtml(null);
    setDocxError(null);
    setDocxLoading(Boolean(documentKey && document && getFilePreviewType(document.originalName, document.mimeType) === 'docx'));
    setImageZoom(1); setImageRotation(0); setDocxZoom(100);
  }
  useEffect(() => {
    if (!isOpen || !document) return;
    const controller = new AbortController();
    const previewType = getFilePreviewType(document.originalName, document.mimeType);

    if (previewType === 'docx') {
      fetch(`/api/backend/documents/${document.id}/docx-preview`, { signal: controller.signal })
        .then((res) => {
          if (!res.ok) throw new Error('No se pudo cargar la vista previa del documento Word.');
          return res.json();
        })
        .then((data) => {
          if (!controller.signal.aborted) setDocxHtml(data.html || '<p>Documento vacío</p>');
        })
        .catch((err) => {
          if (controller.signal.aborted) return;
          setDocxError(err instanceof Error ? err.message : 'Error al procesar DOCX');
        })
        .finally(() => {
          if (!controller.signal.aborted) setDocxLoading(false);
        });
    }
    return () => controller.abort();
  }, [isOpen, document]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !document) return null;

  const previewType: PreviewableType = getFilePreviewType(
    document.originalName,
    document.mimeType
  );
  const fileExtension = getFileExtension(document.originalName);
  const downloadUrl = document.url || `/api/backend/documents/${document.id}/download`;
  const inlineUrl = `${downloadUrl}${downloadUrl.includes('?') ? '&' : '?'}inline=1`;

  const renderIcon = () => {
    switch (previewType) {
      case 'docx':
        return <FileText className="text-blue-600" size={20} />;
      case 'image':
        return <ImageIcon className="text-emerald-600" size={20} />;
      case 'pdf':
        return <FileType className="text-red-600" size={20} />;
      default: {
        const ext = fileExtension.toLowerCase();
        if (['xlsx', 'xls', 'csv'].includes(ext)) {
          return <FileSpreadsheet className="text-emerald-600" size={20} />;
        }
        if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
          return <Archive className="text-amber-600" size={20} />;
        }
        if (['mp4', 'mov', 'avi', 'mkv'].includes(ext)) {
          return <Film className="text-purple-600" size={20} />;
        }
        if (['mp3', 'wav', 'ogg'].includes(ext)) {
          return <Music className="text-pink-600" size={20} />;
        }
        return <FileCode className="text-slate-600" size={20} />;
      }
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="document-preview-title"
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/80 p-2 sm:p-4 backdrop-blur-xs animate-in fade-in"
    >
      <div
        className={`relative flex flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-card shadow-2xl transition-all ${
          isFullScreen
            ? 'h-[98vh] w-[98vw]'
            : 'max-h-[92vh] w-full max-w-5xl'
        }`}
      >
        {/* Header Bar */}
        <header className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-5 py-3.5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-card shadow-2xs">
              {renderIcon()}
            </div>
            <div className="min-w-0">
              <h2
                id="document-preview-title"
                className="truncate text-sm font-bold text-slate-900"
                title={document.originalName}
              >
                {document.originalName}
              </h2>
              <p className="text-xs text-slate-500">
                {getFileTypeLabel(previewType, document.originalName)}
                {document.size ? ` · ${formatBytes(document.size)}` : ''}
                {document.project?.name ? ` · ${document.project.name}` : ''}
              </p>
            </div>
          </div>

          {/* Action controls */}
          <div className="flex items-center gap-1.5">
            {/* DOCX Controls */}
            {previewType === 'docx' && !docxLoading && !docxError && (
              <div className="hidden items-center gap-1 rounded-xl border border-slate-200 bg-card px-2 py-1 sm:flex">
                <button
                  type="button"
                  onClick={() => setDocxZoom((z) => Math.max(70, z - 15))}
                  className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                  title="Reducir zoom"
                >
                  <ZoomOut size={15} />
                </button>
                <span className="min-w-[42px] text-center font-mono text-xs text-slate-600">
                  {docxZoom}%
                </span>
                <button
                  type="button"
                  onClick={() => setDocxZoom((z) => Math.min(150, z + 15))}
                  className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                  title="Aumentar zoom"
                >
                  <ZoomIn size={15} />
                </button>
              </div>
            )}

            {/* Image Controls */}
            {previewType === 'image' && (
              <div className="hidden items-center gap-1 rounded-xl border border-slate-200 bg-card px-2 py-1 sm:flex">
                <button
                  type="button"
                  onClick={() => setImageZoom((z) => Math.max(0.5, z - 0.25))}
                  className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                  title="Reducir zoom"
                >
                  <ZoomOut size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => setImageZoom(1)}
                  className="px-1.5 text-xs text-slate-600 hover:text-slate-900"
                  title="Restablecer zoom"
                >
                  100%
                </button>
                <button
                  type="button"
                  onClick={() => setImageZoom((z) => Math.min(3, z + 0.25))}
                  className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                  title="Aumentar zoom"
                >
                  <ZoomIn size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => setImageRotation((r) => (r + 90) % 360)}
                  className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                  title="Rotar imagen"
                >
                  <RotateCw size={15} />
                </button>
              </div>
            )}

            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={() => setIsFullScreen((f) => !f)}
              className="hidden rounded-xl border border-slate-200 bg-card p-2 text-slate-600 hover:bg-slate-100 sm:flex"
              title={isFullScreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
            >
              {isFullScreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>

            {/* Abrir en pestaña: solo lo que el navegador muestra por sí mismo (un .docx se descargaría) */}
            {(previewType === 'pdf' || previewType === 'image') && (
              <a
                href={inlineUrl}
                target="_blank"
                rel="noreferrer"
                className="hidden rounded-xl border border-slate-200 bg-card p-2 text-slate-600 hover:bg-slate-100 sm:flex"
                title="Abrir en pestaña nueva"
              >
                <ExternalLink size={16} />
              </a>
            )}

            {/* Download Button */}
            <a
              href={downloadUrl}
              download={document.originalName}
              className="flex items-center gap-1.5 rounded-xl bg-orange-600 px-3.5 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-orange-500"
              title="Descargar archivo"
            >
              <Download size={15} />
              <span className="hidden sm:inline">Descargar</span>
            </a>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
              aria-label="Cerrar previsualizador"
            >
              <X size={20} />
            </button>
          </div>
        </header>

        {/* Viewport Content */}
        <div className="flex flex-1 items-center justify-center overflow-y-auto bg-slate-100/70 p-4 sm:p-6 min-h-[400px]">
          {/* ================================================= */}
          {/* 1. DOCX PREVIEW                                   */}
          {/* ================================================= */}
          {previewType === 'docx' && (
            <div className="w-full">
              {docxLoading ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <Loader2 size={36} className="animate-spin text-blue-600" />
                  <p className="mt-4 text-sm font-semibold text-slate-700">
                    Procesando y cargando documento Word (.docx)…
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Generando formato enriquecido para lectura directa
                  </p>
                </div>
              ) : docxError ? (
                <div className="mx-auto max-w-md rounded-2xl border border-red-200 bg-card p-8 text-center shadow-xs">
                  <FileText size={48} className="mx-auto text-red-500" />
                  <h3 className="mt-3 text-base font-bold text-slate-900">
                    No fue posible previsualizar este documento Word
                  </h3>
                  <p className="mt-2 text-xs text-slate-500">{docxError}</p>
                  <a
                    href={downloadUrl}
                    download={document.originalName}
                    className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-brand-button px-5 py-2.5 text-xs font-semibold text-white hover:bg-brand-hover"
                  >
                    <Download size={15} />
                    <span>Descargar archivo original</span>
                  </a>
                </div>
              ) : (
                <div
                  className="mx-auto my-4 transition-transform duration-150"
                  style={{
                    maxWidth: '850px',
                    transform: `scale(${docxZoom / 100})`,
                    transformOrigin: 'top center',
                  }}
                >
                  <div className="rounded-2xl border border-slate-200 bg-card p-8 shadow-md sm:p-14">
                    <div className="border-b border-slate-100 pb-4 mb-6 flex items-center justify-between text-xs text-slate-400">
                      <span className="font-semibold text-blue-700 flex items-center gap-1">
                        <FileText size={14} /> Documento Word
                      </span>
                      <span>{document.originalName}</span>
                    </div>
                    <div
                      className="docx-content prose prose-slate max-w-none text-slate-800"
                      dangerouslySetInnerHTML={{ __html: docxHtml || '' }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================================================= */}
          {/* 2. IMAGE PREVIEW                                  */}
          {/* ================================================= */}
          {previewType === 'image' && (
            <div className="flex h-full w-full items-center justify-center overflow-auto p-2">
              <img
                src={inlineUrl}
                alt={document.originalName}
                style={{
                  transform: `scale(${imageZoom}) rotate(${imageRotation}deg)`,
                  transition: 'transform 0.15s ease-out',
                }}
                className="max-h-[72vh] max-w-full rounded-2xl object-contain shadow-md"
              />
            </div>
          )}

          {/* ================================================= */}
          {/* 3. PDF PREVIEW                                    */}
          {/* ================================================= */}
          {previewType === 'pdf' && (
            <div className="h-[75vh] w-full overflow-hidden rounded-2xl border border-slate-200 bg-black/40 shadow-inner">
              <iframe
                src={inlineUrl}
                title={document.originalName}
                className="h-full w-full rounded-2xl border-0 bg-card"
              />
            </div>
          )}

          {/* ================================================= */}
          {/* 4. UNSUPPORTED / DOWNLOAD FALLBACK (SOLO ESOS)    */}
          {/* ================================================= */}
          {previewType === 'unsupported' && (
            <div className="mx-auto my-8 max-w-lg rounded-3xl border border-slate-200 bg-card p-8 text-center shadow-lg sm:p-12">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-100 text-slate-600 ring-8 ring-slate-50">
                {renderIcon()}
              </div>

              <div className="mt-6">
                <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  Formato .{fileExtension}
                </span>
                <h3 className="mt-3 text-lg font-bold text-slate-900">
                  Vista previa no disponible para este formato
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-500">
                  La previsualización interactiva en el panel está habilitada para documentos{' '}
                  <strong className="text-slate-800">Word (.docx)</strong>,{' '}
                  <strong className="text-slate-800">Imágenes</strong> y{' '}
                  <strong className="text-slate-800">PDFs</strong>.
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Para abrir este archivo ({document.originalName}), descárgalo en tu dispositivo.
                </p>
              </div>

              <div className="mt-8 flex flex-col items-center justify-center gap-3">
                <a
                  href={downloadUrl}
                  download={document.originalName}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-600 py-3.5 text-sm font-semibold text-white shadow-xs transition hover:bg-orange-500"
                >
                  <Download size={18} />
                  <span>Descargar archivo {document.size ? `(${formatBytes(document.size)})` : ''}</span>
                </a>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  Regresar al panel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
