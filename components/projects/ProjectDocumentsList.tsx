'use client';

import { DocumentActions } from '@/components/internal/DocumentActions';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import type { ProjectDocument } from '@/src/modules/projects/types';
import {
  DocumentPreviewModal,
  DocumentPreviewTarget,
} from '@/components/shared/DocumentPreviewModal';
import { getFilePreviewType } from '@/src/lib/file-preview-helpers';
import { Eye } from 'lucide-react';

const labels: Record<string, string> = {
  COMMERCIAL_PROPOSAL: 'Propuesta',
  SIGNED_CONTRACT: 'Contrato',
  INVOICE: 'Factura',
  PAYMENT_PROOF: 'Comprobante',
  DELIVERABLE: 'Entregable',
  INTERNAL_FILE: 'Interno',
  OTHER: 'Otro',
};
const types = Object.entries(labels);

export function ProjectDocumentsList({
  documents,
  empty,
}: {
  documents: ProjectDocument[];
  empty: string;
}) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<DocumentPreviewTarget | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const router = useRouter();

  const update = (document: ProjectDocument, formData: FormData) =>
    startTransition(async () => {
      setPendingId(document.id);
      setMessage(null);
      setError(null);
      const response = await fetch(`/api/backend/documents/${document.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalName: String(formData.get('originalName') || ''),
          type: String(formData.get('type') || document.type),
          visibleToClient: formData.get('visibleToClient') === 'on',
        }),
      });
      const body = await response.json().catch(() => null);
      setPendingId(null);
      if (!response.ok) {
        setError(body?.error || 'No se pudo actualizar el documento');
        return;
      }
      setMessage(`“${body.document.originalName}” se actualizó correctamente.`);
      router.refresh();
    });

  const remove = (document: ProjectDocument) => {
    if (
      !window.confirm(
        `¿Eliminar “${document.originalName}”? Esta acción también elimina el archivo almacenado.`
      )
    )
      return;
    startTransition(async () => {
      setPendingId(document.id);
      setMessage(null);
      setError(null);
      const response = await fetch(`/api/backend/documents/${document.id}`, { method: 'DELETE' });
      const body = await response.json().catch(() => null);
      setPendingId(null);
      if (!response.ok) {
        setError(body?.error || 'No se pudo eliminar el documento');
        return;
      }
      setMessage(`“${document.originalName}” se eliminó correctamente.`);
      router.refresh();
    });
  };

  if (documents.length === 0)
    return (
      <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-slate-500">
        {empty}
      </div>
    );

  return (
    <div className="space-y-3">
      <div aria-live="polite" aria-atomic="true">
        {message && (
          <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p>
        )}
        {error && (
          <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">
            {error}
          </p>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border bg-white">
        <div className="divide-y">
          {documents.map((document) => {
            const previewType = getFilePreviewType(document.originalName, document.mimeType);
            const isPreviewable = previewType !== 'unsupported';

            return (
              <article key={document.id} className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div
                    className="min-w-0 cursor-pointer"
                    onClick={() => setSelectedDoc(document)}
                  >
                    <h3 className="truncate text-sm font-semibold text-slate-900 hover:text-orange-600">
                      {document.originalName}
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      {labels[document.type] || document.type} · {(document.size / 1024).toFixed(0)} KB ·{' '}
                      {document.uploadedBy.name}
                    </p>
                    {document.visibleToClient && (
                      <span className="mt-2 inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                        Visible al cliente
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedDoc(document)}
                      className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold hover:bg-slate-50"
                    >
                      <Eye size={14} />
                      <span>{isPreviewable ? 'Vista previa' : 'Ver info'}</span>
                    </button>
                    <Link
                      href={`/api/backend/documents/${document.id}/download`}
                      className="inline-flex min-h-10 items-center rounded-xl border px-3 text-xs font-semibold hover:bg-slate-50"
                    >
                      Descargar
                    </Link>
                    <button
                      type="button"
                      onClick={() => remove(document)}
                      disabled={pendingId === document.id}
                      className="min-h-10 rounded-xl border border-rose-200 px-3 text-xs font-semibold text-rose-700 disabled:opacity-50"
                    >
                      {pendingId === document.id ? 'Procesando…' : 'Eliminar'}
                    </button>
                  </div>
                </div>

                <details className="mt-3 rounded-xl bg-slate-50 p-3">
                  <summary className="cursor-pointer text-xs font-semibold text-slate-600">
                    Editar datos del archivo
                  </summary>
                  <DocumentActions document={document} />
            <form
                    action={update.bind(null, document)}
                    className="mt-3 grid gap-3 sm:grid-cols-[1fr_12rem_auto_auto]"
                  >
                    <label className="text-xs font-medium text-slate-600">
                      Nombre
                      <input
                        name="originalName"
                        defaultValue={document.originalName}
                        className="mt-1 min-h-10 w-full rounded-lg border bg-white px-3 text-xs"
                      />
                    </label>
                    <label className="text-xs font-medium text-slate-600">
                      Tipo
                      <select
                        name="type"
                        defaultValue={document.type}
                        className="mt-1 min-h-10 w-full rounded-lg border bg-white px-3 text-xs"
                      >
                        {types.map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="flex min-h-10 items-center gap-2 self-end text-xs">
                      <input
                        type="checkbox"
                        name="visibleToClient"
                        defaultChecked={document.visibleToClient}
                      />
                      Visible al cliente
                    </label>
                    <button
                      disabled={pendingId === document.id}
                      className="min-h-10 self-end rounded-lg bg-slate-900 px-4 text-xs font-semibold text-white disabled:opacity-50"
                    >
                      {pendingId === document.id ? 'Guardando…' : 'Guardar cambios'}
                    </button>
                  </form>
                </details>
              </article>
            );
          })}
        </div>
      </div>

      {selectedDoc && (
        <DocumentPreviewModal
          document={selectedDoc}
          isOpen={Boolean(selectedDoc)}
          onClose={() => setSelectedDoc(null)}
        />
      )}
    </div>
  );
}
